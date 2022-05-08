import { AppSyncEvent, Identity, Helpers } from '../../../client/src'
import { graphQlQueryToJson } from '../gql-query-to-json'

export default function ({
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

    if (Object.keys(args).length > 0) {
        delete selectionSet.__args
    }

    const selectionSetList = Object.keys(Helpers.dotate(selectionSet)).map((selection) => selection.replace(/\./g, '/'))

    selectionSetList.unshift('__typename')

    const event: AppSyncEvent = {
        arguments: args,
        source: null,
        identity,
        info: {
            parentTypeName,
            fieldName,
            variables,
            selectionSetList,
            selectionSetGraphQL,
        },
        request: request,
        prev: { result: null },
        stash: null,
    }

    return event
}
