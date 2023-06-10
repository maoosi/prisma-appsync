import type { AppSyncEvent, AppSyncIdentity, Identity } from '../../../packages/client/src'
import { _ } from '../../../packages/client/src'
import { graphQlQueryToJson } from './graphql-json'

export default function mockLambdaEvent({
    request,
    graphQLParams,
    identity,
}: {
    request: any
    graphQLParams: { query: string; variables?: any; operationName: string; raw?: any }
    identity: Identity
}): AppSyncEvent[] {
    const events: AppSyncEvent[] = []
    const selectionSetGraphQL = graphQLParams.query
    const variables = graphQLParams.variables || {}
    const operationName = graphQLParams.operationName
    const queries = graphQlQueryToJson(selectionSetGraphQL, { variables, operationName })
    const parentType: string = Object.keys(queries)[0]

    for (let queryIndex = 0; queryIndex < Object.keys(queries[parentType]).length; queryIndex++) {
        const fieldName: string = Object.keys(queries[parentType])[queryIndex]
        const parentTypeName = parentType.charAt(0).toUpperCase() + parentType.slice(1)
        const selectionSet = queries[parentType][fieldName]
        const args = typeof selectionSet.__args !== 'undefined' ? selectionSet.__args : {}

        if (Object.keys(args).length > 0)
            delete selectionSet.__args

        const selectionSetList = Object.keys(_.dotate(selectionSet))
            .filter(selection => selection !== '.')
            .map(selection => selection.replace(/\./g, '/'))

        selectionSetList.unshift('__typename')

        const event: AppSyncEvent = {
            arguments: args,
            source: null,
            identity: identity as AppSyncIdentity,
            info: {
                parentTypeName,
                fieldName,
                variables,
                selectionSetList,
                selectionSetGraphQL,
            },
            request,
            prev: { result: {} },
            stash: {},
        }

        events.push(event)
    }

    return events
}
