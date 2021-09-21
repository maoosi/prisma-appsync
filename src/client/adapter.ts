import { InternalError, inspect } from './logger'
import { merge, dotate } from './utils'
import {
    PrismaAppSyncOptions,
    AppsyncEvent,
    ResolverQuery,
    Action,
    Actions,
    Model,
    Args,
    ActionsAliasesList,
    ActionsAlias,
    Subject,
    AuthIdentity,
    AuthModes,
    ReservedPrismaKeys,
    BatchActionsList,
    Operation
} from './defs'


/**
 * Return ResolverQuery from parse AppSync direct resolver event.
 * @param  {AppsyncEvent} appsyncEvent
 * @param  {PrismaAppSyncOptions} options
 * @param  {any|null} customResolvers?
 * @returns ResolverQuery
 */
export function parseEvent(
    appsyncEvent:AppsyncEvent, options:PrismaAppSyncOptions, customResolvers?:any|null
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

    let action:Action, model:Model, subject: Subject
    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })

    if (customResolvers && typeof customResolvers[operation] !== 'undefined') {
        action = operation
        subject = operation
    } else {
        action = getAction({ operation })
        model = getModel({ operation, action })

        if (
            options?.generatedConfig?.prismaClientModels && 
            typeof options.generatedConfig.prismaClientModels[model] !== 'undefined'
        ) {
            model = options.generatedConfig.prismaClientModels[model]
        } else {
            throw new InternalError('Issue parsing prismaClientModels from auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.')
        }

        subject = {
            actionAlias: getActionAlias({ action }),
            model: model
        }
    }
    
    const authIdentity = getAuthIdentity({ 
        appsyncEvent 
    })
    const fields = getFields({ 
        _selectionSetList: appsyncEvent.info.selectionSetList
    })
    const args = getArgs({ 
        action, 
        _arguments: appsyncEvent.arguments, 
        _selectionSetList: appsyncEvent.info.selectionSetList, 
        defaultPagination: options.defaultPagination
    })
    const type = getType({ 
        _parentTypeName: appsyncEvent.info.parentTypeName
    })
    const paths = getPaths({ 
        action, subject, args
    })

    return { operation, action, subject, fields, args, type, authIdentity, paths }
}


/**
 * Return auth. identity from parsed `event`.
 * @param  {{appsyncEvent:any}} {appsyncEvent}
 * @returns AuthIdentity
 */
export function getAuthIdentity(
    { appsyncEvent }: { appsyncEvent: any }
):AuthIdentity {
    let authIdentity:AuthIdentity = null

    // https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html#aws-appsync-resolver-context-reference-identity

    // API_KEY authorization
    if (
        typeof appsyncEvent.identity === 'undefined' || 
        !appsyncEvent.identity || 
        appsyncEvent.identity.length < 1
    ) {
        authIdentity = merge(appsyncEvent.identity, {
            authorization: AuthModes.API_KEY,
            ...(
                appsyncEvent.request && 
                appsyncEvent.request.headers &&
                typeof appsyncEvent.request.headers['x-api-key'] !== 'undefined' &&
                {
                    requestApiKey: appsyncEvent.request.headers['x-api-key'],
                }
            ),
            ...(
                appsyncEvent.request && 
                appsyncEvent.request.headers &&
                typeof appsyncEvent.request.headers['user-agent'] !== 'undefined' &&
                {
                    requestUserAgent: appsyncEvent.request.headers['user-agent'],
                }
            )
        })
    }
    // AWS_LAMBDA authorization
    else if (
        typeof appsyncEvent.identity['resolverContext'] !== 'undefined'
    ) {
        authIdentity = merge(appsyncEvent.identity, {
            authorization: AuthModes.AWS_LAMBDA
        })
    }
    // AWS_IAM authorization
    else if (
        typeof appsyncEvent.identity['cognitoIdentityAuthType'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityAuthProvider'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityPoolId'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityId'] !== 'undefined'
    ) {
        authIdentity = merge(appsyncEvent.identity, {
            authorization: AuthModes.AWS_IAM
        })
    }
    // AMAZON_COGNITO_USER_POOLS authorization
    else if (
        typeof appsyncEvent.identity['sub'] !== 'undefined' &&
        typeof appsyncEvent.identity['issuer'] !== 'undefined' &&
        typeof appsyncEvent.identity['username'] !== 'undefined' &&
        typeof appsyncEvent.identity['claims'] !== 'undefined' &&
        typeof appsyncEvent.identity['sourceIp'] !== 'undefined' &&
        typeof appsyncEvent.identity['defaultAuthStrategy'] !== 'undefined'
    ) {
        authIdentity = merge(appsyncEvent.identity, {
            authorization: AuthModes.AMAZON_COGNITO_USER_POOLS
        })
    } 
    // AWS_OIDC authorization
    else if (
        typeof appsyncEvent.identity['sub'] !== 'undefined' &&
        typeof appsyncEvent.identity['issuer'] !== 'undefined' &&
        typeof appsyncEvent.identity['claims'] !== 'undefined'
    ) {
        authIdentity = merge(appsyncEvent.identity, {
            authorization: AuthModes.AWS_OIDC
        })
    } 
    // ERROR
    else {
        throw new InternalError(
            `Couldn't detect caller identity from: ${inspect(appsyncEvent.identity)}`
        )
    }

    return authIdentity
}


/**
 * Return operation (`getPost`, `listUsers`, ...) from parsed `event.info.fieldName`.
 * @param  {{fieldName:string}} {fieldName}
 * @returns string
 */
export function getOperation(
    { fieldName }: { fieldName: string }
):Operation {
    const operation = fieldName as Operation

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
 * @param  {{action:string}} {action}
 * @returns ActionsAlias
 */
export function getActionAlias(
    { action }: { action: Action }
):ActionsAlias {
    let actionAlias:ActionsAlias

    for (const alias in ActionsAliasesList) {
        const actionsList = ActionsAliasesList[alias]

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
 * @returns string[]
 */
export function getFields(
    { _selectionSetList }: { _selectionSetList:string[] }
):string[] {
    const fields = []

    _selectionSetList.forEach((item:string) => {
        const field = item.split('/')[0]
        if (!fields.includes(field) && !field.startsWith('__')) {
            fields.push(item)
        }
    })

    return fields
}


/**
 * Return GraphQL type (`Query`, `Mutation` or `Subscription`) from parsed `event.info.parentTypeName`.
 * @param  {{_parentTypeName:string}} {_parentTypeName}
 * @returns 'Query' | 'Mutation' | 'Subscription'
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
 * @param  {{action: Action, _arguments:any, defaultPagination:false|number}} { action, _arguments, defaultPagination }
 * @returns Args
 */
export function getArgs(
    { action, _arguments, _selectionSetList, defaultPagination }: 
    { action: Action, _arguments:any, _selectionSetList:any, defaultPagination:false|number }
): Args {
    const args:Args = {}

    if (typeof _arguments.data !== 'undefined') args.data = _arguments.data
    if (typeof _arguments.where !== 'undefined') args.where = _arguments.where
    if (typeof _arguments.orderBy !== 'undefined') args.orderBy = parseOrderBy(_arguments.orderBy)
    if (typeof _arguments.skipDuplicates !== 'undefined') args.skipDuplicates = _arguments.skipDuplicates

    if (typeof _selectionSetList !== 'undefined') {
        args.select = parseSelectionList(_selectionSetList)
    }

    if (typeof _arguments.skip !== 'undefined') args.skip = parseInt(_arguments.skip)
    else if (defaultPagination !== false && action === Actions.list) {
        args.skip = 0
    }

    if (typeof _arguments.take !== 'undefined') args.take = parseInt(_arguments.take)
    else if (defaultPagination !== false && action === Actions.list) {
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
 * @returns any[]
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


/**
 * Return individual `include` field formatted for Prisma.
 * @param  {any} parts
 * @returns any
 */
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


/**
 * Return individual `select` field formatted for Prisma.
 * @param  {any} parts
 * @returns any
 */
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


/**
 * Return Prisma `select` from parsed `event.arguments.info.selectionSetList`.
 * @param  {any} selectionSetList
 * @returns any
 */
function parseSelectionList(selectionSetList:any): any {
    let args:any = {}

    for (let i = 0; i < selectionSetList.length; i++) {
        const path = selectionSetList[i]
        const parts = path.split('/')

        if (!parts.includes('__typename')) {
            if (parts.length > 1) args = merge(args, getInclude(parts))
            else args = merge(args, getSelect(parts))
        }
    }

    if (args.include) {
        for (const include in args.include) {
            if (typeof args.select[include] !== 'undefined') delete args.select[include]
        }

        args.select = merge(args.select, args.include)
        delete args.include
    }
    
    return typeof args.select !== 'undefined'
        ? args.select
        : {}
}


/**
 * Return req and res paths (`/update/post/title`, `/get/post/date`, ...)
 * @param  {{action:Action, subject:Subject, args:Args}} {action, subject, args}
 * @returns string[]
 */
export function getPaths(
    { action, subject, args }:
    { action:Action, subject:Subject, args:Args }
):string[] {
    const paths:string[] = []
    const model = typeof subject === 'string' ? subject : subject.model
    const isBatchAction:boolean = BatchActionsList.includes(action)

    if (typeof args.data !== 'undefined') {
        const inputs:any[] = Array.isArray(args.data) ? args.data : [args.data]

        inputs.forEach((input:any) => {
            const objectPaths = dotate(input)

            for (const key in objectPaths) {
                const item = key.split('.').filter((k) => !ReservedPrismaKeys.includes(k)).join('/')
                const path = (`/${action}/${model}/${item}`).toLowerCase()
                if (!paths.includes(path)) paths.push(path)
            }
        })
    }

    if (typeof args.select !== 'undefined') {
        const objectPaths = dotate(args.select)

        for (const key in objectPaths) {
            const item = key.split('.').filter((k) => !ReservedPrismaKeys.includes(k)).join('/')
            const selectAction = isBatchAction ? Actions.list : Actions.get
            const path = (`/${selectAction}/${model}/${item}`).toLowerCase()
            if (!paths.includes(path)) paths.push(path)
        }
    }

    return paths
}