import { AppsyncEvent, ResolverQuery, Action, Actions, Model, Args } from './defs'

// parse appsync event in lambda resolver
export function parseEvent(
    appsyncEvent:AppsyncEvent, customResolvers?:any
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

    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })
    const action = getAction({ operation })
    const model = getModel({ operation, action })
    const fields = getFields({ _selectionSetList: appsyncEvent.info.selectionSetList })
    const args = getArgs({ action, _arguments: appsyncEvent.arguments })
    const type = getType({ _parentTypeName: appsyncEvent.info.parentTypeName })

    return { operation, action, model, fields, args, type }
}

// return operation (getPost, listUsers, ...)
export function getOperation(
    { fieldName }: { fieldName: string }
):string {
    const operation = fieldName

    if (! (operation.length > 0) )
        throw new Error(`Error parsing 'operation' from input event.`)
    
    return operation
}

// return action (get, list, create, ...)
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

// return model (Post, User, ...)
export function getModel(
    { operation, action }: { operation: string, action: Action }
):Model {
    const model = operation.replace(action, '') as Model

    if (! (model.length > 0) ) 
        throw new Error(`Error parsing 'model' from input event.`)

    return model
}

// return fields (title, author, ...)
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

// return GraphQL type (Query, Mutation, Subscription)
export function getType(
    { _parentTypeName }: { _parentTypeName:string }
): 'Query' | 'Mutation' | 'Subscription' {
    const type = _parentTypeName

    if (!['Query', 'Mutation', 'Subscription'].includes(type))
        throw new Error(`Error parsing 'type' from input event.`)

    return type as 'Query' | 'Mutation' | 'Subscription'
}

// return Prisma args (where, data, orderBy, ...)
export function getArgs(
    { action, _arguments, defaultPagination }: 
    { action: Action, _arguments:any, defaultPagination?:false|number }
): Args {
    const args:Args = {}

    if (typeof _arguments.data !== 'undefined') args.data = _arguments.data
    if (typeof _arguments.where !== 'undefined') args.where = _arguments.where
    if (typeof _arguments.orderBy !== 'undefined') args.orderBy = parseOrderBy(_arguments.orderBy)
    if (typeof _arguments.skipDuplicates !== 'undefined') args.skipDuplicates = _arguments.skipDuplicates

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

function getOrderBy(sortObj:any): any {
    const key:any = Object.keys(sortObj)[0]
    const value = typeof sortObj[key] === 'object'
        ? getOrderBy(sortObj[key])
        : sortObj[key].toLowerCase()

    return { [key]: value }
}

function parseOrderBy(orderByInputs:any): any[] {
    const orderByOutput:any = []
    const orderByInputsArray = Array.isArray(orderByInputs)
        ? orderByInputs : [orderByInputs]
    orderByInputsArray.forEach((orderByInput:any) => {
        orderByOutput.push( getOrderBy(orderByInput) )
    })

    return orderByOutput
}