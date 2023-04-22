import { GraphQLList, GraphQLObjectType } from 'graphql'
import type { GraphQLSchema } from 'graphql'
import { _ } from '../../../client/src'

// Function to add '__typename' values to the partial result object
export async function addTypename(
    schema: GraphQLSchema,
    partialResultObject: Record<string, any>,
) {
    return await _.traverseNodes(partialResultObject, async (node) => {
        if (node?.key === '__typename') {
            const pathsWithoutArrays = node.path?.filter(p => typeof p === 'string')

            let fields = schema.getQueryType()?.getFields()?.[pathsWithoutArrays?.[0]]

            for (let index = 1; index < pathsWithoutArrays.length - 1; index++) {
                if (fields?.type.constructor.name === GraphQLObjectType.name)
                    fields = (fields?.type as GraphQLObjectType)?.getFields()?.[pathsWithoutArrays[index]]
                else if (fields?.type.constructor.name === GraphQLList.name)
                    fields = (fields?.type as GraphQLList<any>)?.ofType?.getFields()?.[pathsWithoutArrays[index]]
            }

            if (fields?.type)
                node.set(String(fields.type).replace(/[\])}[{(!]/g, ''))
        }
    })
}
