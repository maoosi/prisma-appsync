import type { AppSyncEvent, AppSyncIdentity, Identity } from '../../client/src'
import { _ } from '../../client/src'
import { graphQlQueryToJson } from './useGqlToJson'

export default function useLambdaIdentity({
    request,
    graphQLParams,
    identity,
}: {
    request: any
    graphQLParams: { query: string; variables?: any; operationName: string; raw?: any }
    identity: Identity
}): AppSyncEvent {
    const selectionSetGraphQL = graphQLParams.query
    const variables = graphQLParams.variables || {}
    const operationName = graphQLParams.operationName
    const query: any = graphQlQueryToJson(selectionSetGraphQL, { variables, operationName })
    const parentType: string = Object.keys(query)[0]
    const fieldName: string = Object.keys(query[parentType])[0]
    const parentTypeName = parentType.charAt(0).toUpperCase() + parentType.slice(1)
    const selectionSet = query[parentType][fieldName]
    const args = typeof selectionSet.__args !== 'undefined' ? selectionSet.__args : {}

    if (Object.keys(args).length > 0)
        delete selectionSet.__args

    const selectionSetList = Object.keys(_.dotate(selectionSet)).map(selection => selection.replace(/\./g, '/'))

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

    return event
}
