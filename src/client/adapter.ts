import { InternalError, inspect } from './logger'
import { merge, dotate } from './utils'
import {
    PrismaAppSyncOptions,
    AppsyncEvent,
    QueryParams,
    Action,
    Actions,
    Model,
    Context,
    PrismaArgs,
    ActionsAliasesList,
    ActionsAlias,
    ReservedPrismaKeys,
    BatchActionsList,
    Operation,
    Identity,
    Authorization,
    Authorizations
} from './defs'


/**
 * Parse AppSync direct resolver event and returns Query Params.
 * @param  appsyncEvent AppSync event received in Lambda.
 * @param  options PrismaAppSync Client options.
 * @param  customResolvers Custom Resolvers.
 * @returns `QueryParams`
 */
export function parseEvent(
    appsyncEvent:AppsyncEvent, options:PrismaAppSyncOptions, customResolvers?:any|null
):QueryParams {
    if (!(
        appsyncEvent.info && 
        appsyncEvent.info.fieldName && 
        appsyncEvent.info.selectionSetList &&
        appsyncEvent.info.parentTypeName && 
        appsyncEvent.arguments
    )) {
        throw new Error(`Error reading required parameters from appsyncEvent.`)
    }

    const context:Context = {
        action: null,
        alias: null,
        model: null
    }
    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })

    if (customResolvers && typeof customResolvers[operation] !== 'undefined') {
        context.action = operation
        context.alias = 'custom'
        context.model = null
    } else {
        context.action = getAction({ operation })
        context.model = getModel({ operation, action: context.action })

        if (
            options?.generatedConfig?.prismaClientModels && 
            typeof options.generatedConfig.prismaClientModels[context.model] !== 'undefined'
        ) {
            context.model = options.generatedConfig.prismaClientModels[context.model]
        } else {
            throw new InternalError('Issue parsing prismaClientModels from auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.')
        }

        context.alias = getActionAlias({ action: context.action })
    }
    
    const { identity, authorization } = getAuthIdentity({ 
        appsyncEvent 
    })
    const fields = getFields({ 
        _selectionSetList: appsyncEvent.info.selectionSetList
    })
    const prismaArgs = getPrismaArgs({ 
        action: context.action, 
        _arguments: appsyncEvent.arguments, 
        _selectionSetList: appsyncEvent.info.selectionSetList, 
        defaultPagination: options.defaultPagination
    })
    const type = getType({ 
        _parentTypeName: appsyncEvent.info.parentTypeName
    })
    const paths = getPaths({ 
        context, prismaArgs
    })

    return { operation, context, fields, args: appsyncEvent.arguments, prismaArgs, type, authorization, identity, paths }
}


/**
 * Return auth. identity from parsed `event`.
 * @param  {{appsyncEvent:any}} {appsyncEvent}
 * @returns AuthIdentity
 */
export function getAuthIdentity(
    { appsyncEvent }: { appsyncEvent: any }
):{ identity:Identity, authorization:Authorization } {
    let authorization:Authorization = null
    let identity:Identity = appsyncEvent.identity

    // https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html#aws-appsync-resolver-context-reference-identity

    // API_KEY authorization
    if (
        typeof appsyncEvent.identity === 'undefined' || 
        !appsyncEvent.identity || 
        appsyncEvent.identity.length < 1
    ) {
        authorization = Authorizations.API_KEY
        identity = merge(identity, {
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
        authorization = Authorizations.AWS_LAMBDA
    }
    // AWS_IAM authorization
    else if (
        typeof appsyncEvent.identity['cognitoIdentityAuthType'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityAuthProvider'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityPoolId'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityId'] !== 'undefined'
    ) {
        authorization = Authorizations.AWS_IAM
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
        authorization = Authorizations.AMAZON_COGNITO_USER_POOLS
    } 
    // AWS_OIDC authorization
    else if (
        typeof appsyncEvent.identity['sub'] !== 'undefined' &&
        typeof appsyncEvent.identity['issuer'] !== 'undefined' &&
        typeof appsyncEvent.identity['claims'] !== 'undefined'
    ) {
        authorization = Authorizations.AWS_OIDC
    } 
    // ERROR
    else {
        throw new InternalError(
            `Couldn't detect caller identity from: ${inspect(appsyncEvent.identity)}`
        )
    }

    return { authorization, identity }
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
        throw new Error(`Error parsing 'actionAlias' from input event.`)
    
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
export function getPrismaArgs(
    { action, _arguments, _selectionSetList, defaultPagination }: 
    { action: Action, _arguments:any, _selectionSetList:any, defaultPagination:false|number }
): PrismaArgs {
    const prismaArgs:PrismaArgs = {}

    if (typeof _arguments.data !== 'undefined') prismaArgs.data = _arguments.data
    if (typeof _arguments.where !== 'undefined') prismaArgs.where = _arguments.where
    if (typeof _arguments.orderBy !== 'undefined') prismaArgs.orderBy = parseOrderBy(_arguments.orderBy)
    if (typeof _arguments.skipDuplicates !== 'undefined') prismaArgs.skipDuplicates = _arguments.skipDuplicates

    if (typeof _selectionSetList !== 'undefined') {
        prismaArgs.select = parseSelectionList(_selectionSetList)
    }

    if (typeof _arguments.skip !== 'undefined') prismaArgs.skip = parseInt(_arguments.skip)
    else if (defaultPagination !== false && action === Actions.list) {
        prismaArgs.skip = 0
    }

    if (typeof _arguments.take !== 'undefined') prismaArgs.take = parseInt(_arguments.take)
    else if (defaultPagination !== false && action === Actions.list) {
        prismaArgs.take = defaultPagination
    }

    return prismaArgs
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
    let prismaArgs:any = {}

    for (let i = 0; i < selectionSetList.length; i++) {
        const path = selectionSetList[i]
        const parts = path.split('/')

        if (!parts.includes('__typename')) {
            if (parts.length > 1) prismaArgs = merge(prismaArgs, getInclude(parts))
            else prismaArgs = merge(prismaArgs, getSelect(parts))
        }
    }

    if (prismaArgs.include) {
        for (const include in prismaArgs.include) {
            if (typeof prismaArgs.select[include] !== 'undefined') delete prismaArgs.select[include]
        }

        prismaArgs.select = merge(prismaArgs.select, prismaArgs.include)
        delete prismaArgs.include
    }
    
    return typeof prismaArgs.select !== 'undefined'
        ? prismaArgs.select
        : {}
}


/**
 * Return req and res paths (`/update/post/title`, `/get/post/date`, ...)
 * @param  {{action:Action, subject:Subject, args:Args}} {action, subject, args}
 * @returns string[]
 */
export function getPaths(
    { context, prismaArgs }:
    { context:Context, prismaArgs:PrismaArgs }
):string[] {
    const paths:string[] = []
    const pathRoot = context.model !== null 
        ? `/${context.action}/${context.model}` : `/${context.action}`
    const isBatchAction:boolean = BatchActionsList.includes(context.action)

    if (typeof prismaArgs.data !== 'undefined') {
        const inputs:any[] = Array.isArray(prismaArgs.data) ? prismaArgs.data : [prismaArgs.data]

        inputs.forEach((input:any) => {
            const objectPaths = dotate(input)

            for (const key in objectPaths) {
                const item = key.split('.').filter((k) => !ReservedPrismaKeys.includes(k)).join('/')
                const path = (`${pathRoot}/${item}`).toLowerCase()
                if (!paths.includes(path)) paths.push(path)
            }
        })
    }

    if (typeof prismaArgs.select !== 'undefined' && context.model !== null) {
        const objectPaths = dotate(prismaArgs.select)

        for (const key in objectPaths) {
            const item = key.split('.').filter((k) => !ReservedPrismaKeys.includes(k)).join('/')
            const selectAction = isBatchAction ? Actions.list : Actions.get
            const path = (`/${selectAction}/${context.model}/${item}`).toLowerCase()
            if (!paths.includes(path)) paths.push(path)
        }
    }

    return paths
}