import type { AppSyncEvent, AppSyncIdentity, Identity } from '../../../client/src'
import { _ } from '../../../client/src'
import { graphQlQueryToJson } from './useGraphqlToJson'

function removeArgs(selectionSet: any) {
    for (const [key, value] of Object.entries(selectionSet)) {
        if (key === '__args') {
            delete selectionSet[key]
            continue
        }

        if (value != null && typeof value == 'object' && !Array.isArray(value))
            removeArgs(selectionSet[key])
    }
}

export default function useLambdaEvents({
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

    for (const fieldName of Object.keys(queries[parentType])) {
        const parentTypeName = parentType.charAt(0).toUpperCase() + parentType.slice(1)
        const selectionSet = queries[parentType][fieldName]
        const args = typeof selectionSet.__args !== 'undefined' ? selectionSet.__args : {}

        removeArgs(selectionSet)
        // if (Object.keys(args).length > 0)
        //     delete selectionSet.__args

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
