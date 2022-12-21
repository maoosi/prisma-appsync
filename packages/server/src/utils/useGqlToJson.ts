// adapted from: https://github.com/trayio/graphql-query-to-json

import { parse } from 'graphql'
import { EnumType } from 'json-to-graphql-query'
import mapValues from 'lodash/mapValues'

interface variablesObject {
    [variableName: string]: any
}

interface Argument {
    kind: string
    name: {
        kind: string
        value: string
    }
    value: {
        kind: string
        value: string
        block: boolean
        fields?: Argument[]
        name?: {
            kind: string
            value: string
        }
        values?: Argument[]
    }
}

interface Selection {
    kind: string
    alias: {
        kind: string
        value: string
    }
    name: {
        kind: string
        value: string
    }
    arguments?: Argument[]
    selectionSet?: SelectionSet
}

interface SelectionSet {
    kind: string
    selections: Selection[]
}

interface VariableDefinition {
    kind: string
    variable: {
        kind: string
        name: {
            kind: string
            value: string
        }
    }
    type: {
        kind: string
        name: {
            kind: string
            value: string
        }
    }
}

interface ActualDefinitionNode {
    operation: string
    selectionSet: SelectionSet
    variableDefinitions?: VariableDefinition[]
}

const undefinedVariableConst = 'undefined_variable'
const isVariableDropinConst = '_____isVariableDropinConst'

export const isArray = Array.isArray

export function flatMap(arg: any, callback: any) {
    return arg.reduce((callbackFn: any, initialValue: any) => callbackFn.concat(callback(initialValue)), [])
}

export function isString(arg: any): boolean {
    return typeof arg === 'string'
}

export function isObject(arg: any): boolean {
    return arg instanceof Object
}

function getArgumentObject(argumentFields: Argument[]) {
    const argObj: any = {}
    argumentFields.forEach((arg) => {
        if (arg.value.kind === 'ObjectValue' && arg?.value?.fields) {
            argObj[arg.name.value] = getArgumentObject(arg.value.fields)
        }
        else if (arg.value.kind === 'ListValue') {
            argObj[arg.name.value] = flatMap(arg.value.values, (element: any) => {
                if (typeof element.value !== 'undefined') {
                    return element.value
                }
                else if (element.fields) {
                    const args = getArguments(element.fields)
                    const value: any = {}

                    Object.keys(args).forEach((key) => {
                        value[key] = args[key].value
                    })

                    return value
                }
            })
        }
        else if (arg.value.kind === 'IntValue') {
            argObj[arg.name.value] = parseInt(arg.value.value)
        }
        else if (arg.value.kind === 'Variable') {
            argObj[arg.name.value] = `${arg?.value?.name?.value}${isVariableDropinConst}`
        }
        else {
            argObj[arg.name.value] = arg.value.value
        }
    })
    return argObj
}

function getArguments(args: any) {
    const argsObj: any = {}
    args.forEach((arg: any) => {
        if (arg.value.kind === 'ObjectValue') {
            argsObj[arg.name.value] = getArgumentObject(arg.value.fields)
        }
        else if (arg.value.kind === 'Variable') {
            argsObj[arg.name.value] = `${arg.value.name.value}${isVariableDropinConst}`
        }
        else if (arg.selectionSet) {
            argsObj[arg.name.value] = getSelections(arg.selectionSet.selections)
        }
        else if (arg.value.kind === 'EnumValue') {
            argsObj[arg.name.value] = new EnumType(arg.value.value)
        }
        else if (arg.value.kind === 'IntValue') {
            argsObj[arg.name.value] = parseInt(arg.value.value)
        }
        else if (arg.value.kind === 'ListValue') {
            argsObj[arg.name.value] = flatMap(arg.value.values, (element: any) => {
                if (typeof element.value !== 'undefined') {
                    return element.value
                }
                else if (element.fields) {
                    const args = getArguments(element.fields)
                    const value: any = {}

                    Object.keys(args).forEach((key) => {
                        value[key] = args[key].value
                    })

                    return value
                }
            })
        }
        else {
            argsObj[arg.name.value] = arg.value.value
        }
    })

    return argsObj
}

function getSelections(selections: Selection[]) {
    const selObj: any = {}

    selections.forEach((selection) => {
        const selectionHasAlias = selection.alias
        const selectionName = selectionHasAlias ? selection.alias.value : selection.name.value
        if (selection.selectionSet) {
            selObj[selectionName] = getSelections(selection.selectionSet.selections)
            if (selectionHasAlias)
                selObj[selection.alias.value].__aliasFor = selection.name.value
        }
        if (selection.arguments && selection.arguments.length > 0)
            selObj[selectionName].__args = getArguments(selection.arguments)

        if (!selection.selectionSet && (!selection.arguments || !selection.arguments.length))
            selObj[selectionName] = true
    })
    return selObj
}

function checkEachVariableInQueryIsDefined(defintion: ActualDefinitionNode, variables: variablesObject) {
    const varsList = defintion?.variableDefinitions?.reduce((prev: any, curr: any) => {
        return [
            ...prev,
            {
                key: curr.variable.name.value,
                value: undefinedVariableConst,
            },
        ]
    }, [])

    Object.entries(variables).forEach(([variableKey, variableValue]) => {
        const idx = varsList?.findIndex((element) => {
            return element.key === variableKey
        })
        if (idx !== -1 && varsList && typeof idx !== 'undefined' && typeof varsList[idx] !== 'undefined')
            varsList[idx].value = variableValue
    })

    const undefinedVariable = varsList?.find((varInQuery) => {
        return varInQuery.value === undefinedVariableConst
    })

    if (undefinedVariable) {
        throw new Error(
            'The query you want to parse is using variables. This means that you have to supply for every variable that is used in the query a corresponding value. You can parse these values as a second parameter on the options object, on the "variables" key.',
        )
    }

    return varsList
}

function replaceVariables(obj: any, variables: any): any {
    return mapValues(obj, (value) => {
        if (isString(value) && new RegExp(`${isVariableDropinConst}$`).test(value)) {
            const variableName = value.replace(isVariableDropinConst, '')
            return variables[variableName]
        }
        else if (isObject(value) && !isArray(value)) {
            return replaceVariables(value, variables)
        }
        else {
            return value
        }
    })
}

export function graphQlQueryToJson(
    query: string,
    options: {
        variables: variablesObject
        operationName: string
    } = {
        variables: {},
        operationName: String(),
    },
) {
    const jsonObject: any = {}
    if (!query)
        return jsonObject

    const parsedQuery = parse(query)

    const operationDefinition = parsedQuery.definitions.find((q: any) => {
        return options.operationName === q?.name?.value
    }) || parsedQuery.definitions?.[0]

    // @ts-expect-error: Type 'InputObjectTypeExtensionNode' is missing the following properties from type 'ActualDefinitionNode': operation, selectionSet
    const definition = operationDefinition as ActualDefinitionNode
    const operation = definition.operation

    checkEachVariableInQueryIsDefined(definition, options.variables)

    const selections = getSelections(definition.selectionSet.selections)
    jsonObject[operation] = selections

    const varsReplacedWithValues = replaceVariables(jsonObject, options.variables)
    return varsReplacedWithValues
}
