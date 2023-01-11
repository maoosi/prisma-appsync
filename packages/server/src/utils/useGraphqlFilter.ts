/* eslint-disable @typescript-eslint/no-use-before-define */
import type {
    DocumentNode,
    FragmentDefinitionNode,
    OperationDefinitionNode,
    SelectionSetNode,
} from 'graphql'
import {
    Kind,
} from 'graphql'
import gql from 'graphql-tag'

export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONObject | JSONArray
export interface JSONObject { [member: string]: JSONValue }
export interface JSONArray extends Array<JSONValue> {}
export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
}

  type FragmentMap = Record<string, FragmentDefinitionNode>

interface IOptions {
    includeMissingData?: boolean
}

const createFragmentMap = (query: DocumentNode): FragmentMap => {
    const fragments = query.definitions.filter(
        (definition): definition is FragmentDefinitionNode => {
            return definition.kind === Kind.FRAGMENT_DEFINITION
        },
    )

    const fragmentsMap: FragmentMap = {}
    for (const fragment of fragments) {
        const { name } = fragment
        fragmentsMap[name.value] = fragment
    }
    return fragmentsMap
}

const reduceObject = <T extends JSONObject>(
    selectionSet: SelectionSetNode,
    fragments: FragmentMap,
    object: T,
    options: IOptions,
): T => {
    const reducedObject: Record<string, any> = {}

    for (const selection of selectionSet.selections) {
        if (selection.kind === Kind.FIELD) {
            const { name } = selection
            const fieldName = name.value
            const value = object[fieldName]

            if (typeof value !== 'undefined' && value !== null && value !== '') {
                if (selection.selectionSet) {
                    reducedObject[fieldName] = reduceOutput(
                        selection.selectionSet,
                        fragments,
                        value as JSONObject,
                        options,
                    )
                }
                else {
                    reducedObject[fieldName] = value
                }
            }
            else {
                if (options.includeMissingData) {
                    // If the dataset provided does not include data requested by the query,
                    // include the data in the output as null
                    reducedObject[fieldName] = null
                }
            }
        }
        else if (selection.kind === Kind.FRAGMENT_SPREAD) {
            const { name } = selection
            const fragmentName = name.value
            const fragment = fragments[fragmentName]

            if (fragment) {
                const fragmentReducedObject = reduceOutput(
                    fragment.selectionSet,
                    fragments,
                    object,
                    options,
                )
                for (const key in fragmentReducedObject)
                    reducedObject[key] = fragmentReducedObject[key]
            }
        }
        else if (selection.kind === Kind.INLINE_FRAGMENT) {
            const fragmentReducedObject = reduceOutput(
                selection.selectionSet,
                fragments,
                object,
                options,
            )
            for (const key in fragmentReducedObject)
                reducedObject[key] = fragmentReducedObject[key]
        }
    }

    return reducedObject as T
}

const reduceOutput = <T extends JSONObject | Array<JSONObject>>(
    selectionSet: SelectionSetNode,
    fragments: FragmentMap,
    object: T,
    options: IOptions,
): T => {
    // If object is an array, reduce output for each entry
    if (Array.isArray(object)) {
        const output: Array<JSONObject> = []
        for (const item of object as Array<JSONObject>)
            output.push(reduceObject(selectionSet, fragments, item, options))

        return output as T
    }

    // Or just reduce the object
    return reduceObject(selectionSet, fragments, object, options) as T
}

// TODO option to fill missing data with "null"
export const queryObject = <T extends {}>(
    query: string | DocumentNode,
    data: T,
    options: IOptions = {},
): DeepPartial<T> => {
    const gqlQuery = typeof query == 'string' ? gql(query) : query
    const fragments = createFragmentMap(gqlQuery)

    const operationDefinitions = gqlQuery.definitions.filter(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === Kind.OPERATION_DEFINITION,
    )

    const outputs = operationDefinitions.map((operationDefinition) => {
        return reduceOutput(
            operationDefinition.selectionSet,
            fragments,
            data,
            options,
        )
    })

    // Combine all outputs into one object
    const outputObject: DeepPartial<T> = {}
    for (const output of outputs) {
        for (const key in output)
            outputObject[key] = output[key]
    }

    return outputObject
}
