import { GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import type { GraphQLOutputType, GraphQLSchema } from 'graphql'
import { _ } from '../../../client/src'

function getFields(type: GraphQLOutputType) {
    switch (type.constructor.name) {
        case GraphQLObjectType.name:
            return (type as GraphQLObjectType).getFields()
        case GraphQLList.name:
        case GraphQLNonNull.name:
            return getFields((type as GraphQLList<any> | GraphQLNonNull<any>).ofType)
    }
}

// Function to add '__typename' values to the partial result object
export async function addTypename(
    schema: GraphQLSchema,
    partialResultObject: Record<string, any>,
) {
    return await _.traverseNodes(partialResultObject, async (node) => {
        if (node?.key === '__typename') {
            const pathsWithoutArrays = node.path?.filter(p => typeof p === 'string')

            let fields = schema.getQueryType()?.getFields()?.[pathsWithoutArrays?.[0]]

            if (!fields || !fields?.type)
                return

            for (let index = 1; index < pathsWithoutArrays.length - 1; index++) {
                fields = getFields(fields.type)?.[pathsWithoutArrays[index]]
                if (!fields)
                    return
            }

            if (fields?.type)
                node.set(String(fields.type).replace(/[\])}[{(]/g, ''))
        }
    })
}
