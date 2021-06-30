import {
    AppsyncEvent,
    ResolverQuery,
    Action,
    Actions,
    Model,
    Args,
    ActionsAliases,
    ActionsAlias
} from './defs'
const { merge } = require('lodash')


/**
 * Return ResolverQuery from parse AppSync direct resolver event.
 * @param  {AppsyncEvent} appsyncEvent
 * @param  {any} customResolvers?
 * @returns ResolverQuery
 */
export function parseEvent(
    appsyncEvent:AppsyncEvent, customResolvers?:any|null
):ResolverQuery {
    if (!(
        appsyncEvent.info && 
        appsyncEvent.info.fieldName && 
        appsyncEvent.info.selectionSetList &&
        appsyncEvent.info.parentTypeName && 
        appsyncEvent.arguments
    )) {
        throw new Error(`Error reading required parameters from appsyncEvent.`)
    }

    let model:Model, action:Action, actionAlias:ActionsAlias
    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })

    if (customResolvers && typeof customResolvers[operation] !== 'undefined') {
        action = operation
        actionAlias = operation
        model = 'custom'
    } else {
        action = getAction({ operation })
        actionAlias = getActionAlias({ action })
        model = getModel({ operation, action })
    }
    
    const fields = getFields({ _selectionSetList: appsyncEvent.info.selectionSetList })
    const args = getArgs({ action, _arguments: appsyncEvent.arguments })
    const type = getType({ _parentTypeName: appsyncEvent.info.parentTypeName })

    return { operation, action, actionAlias, model, fields, args, type }
}


/**
 * Return operation (`getPost`, `listUsers`, ...) from parsed `event.info.fieldName`.
 * @param  {{fieldName:string}} {fieldName}
 * @returns string
 */
export function getOperation(
    { fieldName }: { fieldName: string }
):string {
    const operation = fieldName

    if (! (operation.length > 0) )
        throw new Error(`Error parsing 'operation' from input event.`)
    
    return operation
}


/**
 * Return action (`get`, `list`, `create`, ...) from parsed `operation`.
 * @param  {{operation:string}} {operation}
 * @returns Action
 */
export function getAction(
    { operation }: { operation: string }
):Action {
    const actionsList = Object.keys(Actions).sort().reverse()

    const action = actionsList.find((action: Action) => {
        return operation.toLowerCase().startsWith(action.toLowerCase())
    }) as Action

    if (! (typeof action !== 'undefined' && action.length > 0) ) 
        throw new Error(`Error parsing 'action' from input event.`)
    
    return action
}


/**
 * Return action alias (`access`, `create`, `modify`, `subscribe`) from parsed `action`.
 * @param  {{action:string}} {operation}
 * @returns Action
 */
export function getActionAlias(
    { action }: { action: Action }
):ActionsAlias {
    let actionAlias:ActionsAlias

    for (const alias in ActionsAliases) {
        const actionsList = ActionsAliases[alias]

        if (actionsList.includes(action)) {
            actionAlias = alias as ActionsAlias
            break;
        }
    }

    if (! (typeof action !== 'undefined' && action.length > 0) ) 
        throw new Error(`Error parsing 'action' from input event.`)
    
    return actionAlias
}


/**
 *  Return model (`Post`, `User`, ...) from parsed `operation` and `action`.
 * @param  {{operation:string, action:Action}} {operation, action}
 * @returns Model
 */
export function getModel(
    { operation, action }: { operation: string, action: Action }
):Model {
    const model = operation.replace(action, '') as Model

    if (! (model.length > 0) ) 
        throw new Error(`Error parsing 'model' from input event.`)

    return model
}


/**
 * Return fields (`title`, `author`, ...) from parsed `event.info.selectionSetList`.
 * @param  {{_selectionSetList:string[]}} {_selectionSetList}
 * @returns string
 */
export function getFields(
    { _selectionSetList }: { _selectionSetList:string[] }
):string[] {
    const fields = []

    _selectionSetList.forEach((item:string) => {
        const field = item.split('/')[0]
        if (!fields.includes(field) && !field.startsWith('__')) fields.push(item)
    })

    return fields
}


/**
 * Return GraphQL type (`Query`, `Mutation` or `Subscription`) from parsed `event.info.parentTypeName`.
 * @param  {{_parentTypeName:string}} {_parentTypeName}
 * @returns Query
 */
export function getType(
    { _parentTypeName }: { _parentTypeName:string }
): 'Query' | 'Mutation' | 'Subscription' {
    const type = _parentTypeName

    if (!['Query', 'Mutation', 'Subscription'].includes(type))
        throw new Error(`Error parsing 'type' from input event.`)

    return type as 'Query' | 'Mutation' | 'Subscription'
}

/**
 * Return Prisma args (`where`, `data`, `orderBy`, ...) from parsed `action` and `event.arguments`.
 * @param  {{action: Action, _arguments:any, defaultPagination?:false|number}} { action, _arguments, defaultPagination }
 * @returns Args
 */
export function getArgs(
    { action, _arguments, defaultPagination }: 
    { action: Action, _arguments:any, defaultPagination?:false|number }
): Args {
    const args:Args = {}

    if (typeof _arguments.data !== 'undefined') args.data = _arguments.data
    if (typeof _arguments.where !== 'undefined') args.where = _arguments.where
    if (typeof _arguments.orderBy !== 'undefined') args.orderBy = parseOrderBy(_arguments.orderBy)
    if (typeof _arguments.skipDuplicates !== 'undefined') args.skipDuplicates = _arguments.skipDuplicates

    if (typeof _arguments.info !== 'undefined' && typeof _arguments.info.selectionSetList !== 'undefined') {
        args.select = parseSelectionList(_arguments.info.selectionSetList)
    }

    if (typeof _arguments.skip !== 'undefined') args.skip = parseInt(_arguments.skip)
    else if (
        typeof defaultPagination !== 'undefined' &&
        defaultPagination !== false && action === Actions.list) {
        args.skip = 0
    }

    if (typeof _arguments.take !== 'undefined') args.take = parseInt(_arguments.take)
    else if (
        typeof defaultPagination !== 'undefined' &&
        defaultPagination !== false && action === Actions.list) {
        args.take = defaultPagination
    }

    return args
}


/**
 * Return individual `orderBy` record formatted for Prisma.
 * @param  {any} sortObj
 * @returns any
 */
function getOrderBy(sortObj:any): any {
    if (Object.keys(sortObj).length > 1)
        throw new Error(`Wrong 'orderBy' input format.`)

    const key:any = Object.keys(sortObj)[0]
    const value = typeof sortObj[key] === 'object'
        ? getOrderBy(sortObj[key])
        : sortObj[key].toLowerCase()

    return { [key]: value }
}


/**
 * Return Prisma `orderBy` from parsed `event.arguments.orderBy`.
 * @param  {any} orderByInputs
 * @returns any
 */
function parseOrderBy(orderByInputs:any): any[] {
    const orderByOutput:any = []
    const orderByInputsArray = Array.isArray(orderByInputs)
        ? orderByInputs : [orderByInputs]
    orderByInputsArray.forEach((orderByInput:any) => {
        orderByOutput.push( getOrderBy(orderByInput) )
    })

    return orderByOutput
}


function getInclude(parts:any): any {
    const field = parts[0]
    const value = parts.length > 1
        ? getSelect(parts.splice(1))
        : true

    return {
        include: {
            [field]: value
        }
    }
}

function getSelect(parts:any): any {
    const field = parts[0]
    const value = parts.length > 1 
        ? getSelect(parts.splice(1))
        : true

    return {
        select: {
            [field]: value
        }
    }
}


function parseSelectionList(selectionSetList:any) {
    let args:any = {}

    for (let i = 0; i < selectionSetList.length; i++) {
        const path = selectionSetList[i]
        const parts = path.split('/')

        if (!parts.includes('__typename')) {
            if (parts.length > 1) args = merge({}, args, getInclude(parts))
            else args = merge({}, args, getSelect(parts))
        }
    }

    if (args.include) {
        for (const include in args.include) {
            if (typeof args.select[include] !== 'undefined') delete args.select[include]
        }

        args.select = merge({}, args.select, args.include)
        delete args.include
    }
    
    return args.select
}