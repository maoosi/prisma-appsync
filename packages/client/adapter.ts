import { CustomError, inspect } from './inspector'
import { sanitize } from './guard'
import { merge, dotate, isEmpty, isUndefined, lowerFirst, clone, traverse, isObject } from './utils'
import {
    Options,
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
    Authorizations,
    GraphQLType,
    DebugTestingKey,
} from './defs'

/**
 * #### Parse AppSync direct resolver `event` and returns Query Params.
 *
 * @param  {AppsyncEvent} appsyncEvent - AppSync event received in Lambda.
 * @param  {Required<PrismaAppSyncOptionsType>} options - PrismaAppSync Client options.
 * @param  {any|null} customResolvers? - Custom Resolvers.
 * @returns `{ type, operation, context, fields, paths, args, prismaArgs, authorization, identity }` - QueryParams
 */
export function parseEvent(appsyncEvent: AppsyncEvent, options: Options, customResolvers?: any | null): QueryParams {
    if (
        isEmpty(appsyncEvent?.info?.fieldName) ||
        isEmpty(appsyncEvent?.info?.selectionSetList) ||
        isEmpty(appsyncEvent?.info?.parentTypeName) ||
        isUndefined(appsyncEvent?.arguments)
    ) {
        throw new CustomError(`Error reading required parameters from appsyncEvent.`, { type: 'INTERNAL_SERVER_ERROR' })
    }

    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })

    const context = getContext({ customResolvers, options, operation })

    const { identity, authorization } = getAuthIdentity({
        appsyncEvent,
    })

    const fields = getFields({
        _selectionSetList: appsyncEvent.info.selectionSetList,
    })
    const sanitizedArgs = options.sanitize
        ? sanitize(addNullables(appsyncEvent.arguments))
        : addNullables(appsyncEvent.arguments)

    const args = clone(sanitizedArgs)

    const prismaArgs = getPrismaArgs({
        action: context.action,
        defaultPagination: options.defaultPagination,
        _arguments: clone(sanitizedArgs),
        _selectionSetList: appsyncEvent.info.selectionSetList,
    })

    const type = getType({
        _parentTypeName: appsyncEvent.info.parentTypeName,
    })

    const paths = getPaths({
        context,
        args,
        prismaArgs,
    })

    const headers = appsyncEvent?.request?.headers || {}

    return {
        operation,
        context,
        fields,
        args,
        prismaArgs,
        type,
        authorization,
        identity,
        paths,
        headers,
    }
}

/**
 * #### Convert undefined's to NULL's.
 *
 * @param {any} data
 * @returns any
 */
export function addNullables(data: any): any {
    return data

    return traverse(data, (value, key) => {
        let excludeChilds = false

        if (typeof key === 'string' && key === DebugTestingKey) {
            excludeChilds = true
        }
        if (value === undefined) {
            value = null
        }

        return { value, excludeChilds }
    })
}

/**
 * #### Returns authorization and identity.
 *
 * @param {any} options
 * @param {AppsyncEvent} options.appsyncEvent - AppSync event received in Lambda.
 * @returns `{ authorization, identity }`
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html#aws-appsync-resolver-context-reference-identity
 */
export function getAuthIdentity({ appsyncEvent }: { appsyncEvent: AppsyncEvent }): {
    identity: Identity
    authorization: Authorization
} {
    let authorization: Authorization = null
    let identity: Identity = null

    // API_KEY authorization
    if (isEmpty(appsyncEvent?.identity)) {
        authorization = Authorizations.API_KEY
        identity = {
            ...(appsyncEvent?.request?.headers &&
                typeof appsyncEvent.request.headers['x-api-key'] !== 'undefined' && {
                    requestApiKey: appsyncEvent.request.headers['x-api-key'],
                }),
            ...(appsyncEvent?.request?.headers &&
                typeof appsyncEvent.request.headers['user-agent'] !== 'undefined' && {
                    requestUserAgent: appsyncEvent.request.headers['user-agent'],
                }),
        }
    }
    // AWS_LAMBDA authorization
    else if (appsyncEvent?.identity && typeof appsyncEvent.identity['resolverContext'] !== 'undefined') {
        authorization = Authorizations.AWS_LAMBDA
        identity = appsyncEvent.identity
    }
    // AWS_IAM authorization
    else if (
        appsyncEvent?.identity &&
        typeof appsyncEvent.identity['cognitoIdentityAuthType'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityAuthProvider'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityPoolId'] !== 'undefined' &&
        typeof appsyncEvent.identity['cognitoIdentityId'] !== 'undefined'
    ) {
        authorization = Authorizations.AWS_IAM
        identity = appsyncEvent.identity
    }
    // AMAZON_COGNITO_USER_POOLS authorization
    else if (
        appsyncEvent?.identity &&
        typeof appsyncEvent.identity['sub'] !== 'undefined' &&
        typeof appsyncEvent.identity['issuer'] !== 'undefined' &&
        typeof appsyncEvent.identity['username'] !== 'undefined' &&
        typeof appsyncEvent.identity['claims'] !== 'undefined' &&
        typeof appsyncEvent.identity['sourceIp'] !== 'undefined' &&
        typeof appsyncEvent.identity['defaultAuthStrategy'] !== 'undefined'
    ) {
        authorization = Authorizations.AMAZON_COGNITO_USER_POOLS
        identity = appsyncEvent.identity
    }
    // OPENID_CONNECT authorization
    else if (
        appsyncEvent?.identity &&
        typeof appsyncEvent.identity['sub'] !== 'undefined' &&
        typeof appsyncEvent.identity['issuer'] !== 'undefined' &&
        typeof appsyncEvent.identity['claims'] !== 'undefined'
    ) {
        authorization = Authorizations.OPENID_CONNECT
        identity = appsyncEvent.identity
    }
    // ERROR
    else {
        throw new CustomError(`Couldn't detect caller identity from: ${inspect(appsyncEvent.identity)}`, {
            type: 'INTERNAL_SERVER_ERROR',
        })
    }

    return { authorization, identity }
}

/**
 * #### Returns context (`action`, `alias` and `model`).
 *
 * @param  {any} options
 * @param  {any|null} options.customResolvers
 * @param  {Operation} options.operation
 * @param  {Options} options.options
 * @returns Context
 */
export function getContext({
    customResolvers,
    operation,
    options,
}: {
    customResolvers?: any | null
    operation: Operation
    options: Options
}): Context {
    const context: Context = {
        action: String(),
        alias: null,
        model: null,
    }

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
            throw new CustomError(
                'Issue parsing prismaClientModels from auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.',
                { type: 'INTERNAL_SERVER_ERROR' },
            )
        }

        context.alias = getActionAlias({ action: context.action })
    }

    return context
}

/**
 * #### Returns operation (`getPost`, `listUsers`, ..).
 *
 * @param  {any} options
 * @param  {string} options.fieldName
 * @returns Operation
 */
export function getOperation({ fieldName }: { fieldName: string }): Operation {
    const operation = fieldName as Operation

    if (!(operation.length > 0))
        throw new CustomError(`Error parsing 'operation' from input event.`, { type: 'INTERNAL_SERVER_ERROR' })

    return operation
}

/**
 * #### Returns action (`get`, `list`, `create`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @returns Action
 */
export function getAction({ operation }: { operation: Operation }): Action {
    const actionsList = Object.keys(Actions).sort().reverse()

    const action = actionsList.find((action: Action) => {
        return operation.toLowerCase().startsWith(String(action).toLowerCase())
    }) as Action

    if (!(typeof action !== 'undefined' && String(action).length > 0))
        throw new CustomError(
            `Error parsing 'action' from input event. If you are trying to query a custom resolver, make sure it is properly declared inside 'prismaAppSync.resolve({ event, resolvers: { /* HERE */ } })'.`,
            { type: 'INTERNAL_SERVER_ERROR' },
        )

    return action
}

/**
 * #### Returns action alias (`access`, `create`, `modify`, `subscribe`).
 *
 * @param  {any} options
 * @param  {Action} options.action
 * @returns ActionsAlias
 */
export function getActionAlias({ action }: { action: Action }): ActionsAlias {
    let actionAlias: ActionsAlias = null

    for (const alias in ActionsAliasesList) {
        const actionsList = ActionsAliasesList[alias]

        if (actionsList.includes(action)) {
            actionAlias = alias as ActionsAlias
            break
        }
    }

    if (!(typeof action !== 'undefined' && String(action).length > 0)) {
        throw new CustomError(`Error parsing 'actionAlias' from input event.`, { type: 'INTERNAL_SERVER_ERROR' })
    }

    return actionAlias
}

/**
 * #### Returns model (`Post`, `User`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @param  {Action} options.action
 * @returns Model
 */
export function getModel({ operation, action }: { operation: string; action: Action }): Model {
    const model = operation.replace(String(action), '') as Model

    if (!(model.length > 0))
        throw new CustomError(`Error parsing 'model' from input event.`, { type: 'INTERNAL_SERVER_ERROR' })

    return model
}

/**
 * #### Returns fields (`title`, `author`, ...).
 *
 * @param  {any} options
 * @param  {string[]} options._selectionSetList
 * @returns string[]
 */
export function getFields({ _selectionSetList }: { _selectionSetList: string[] }): string[] {
    const fields: string[] = []

    _selectionSetList.forEach((item: string) => {
        const field = item.split('/')[0]
        if (!fields.includes(field) && !field.startsWith('__')) {
            fields.push(item)
        }
    })

    return fields
}

/**
 * #### Returns GraphQL type (`Query`, `Mutation` or `Subscription`).
 *
 * @param {any} options
 * @param {string} options._parentTypeName
 * @returns GraphQLType
 */
export function getType({ _parentTypeName }: { _parentTypeName: string }): GraphQLType {
    const type = _parentTypeName

    if (!['Query', 'Mutation', 'Subscription'].includes(type)) {
        throw new CustomError(`Error parsing 'type' from input event.`, { type: 'INTERNAL_SERVER_ERROR' })
    }

    return type as GraphQLType
}

/**
 * #### Returns Prisma args (`where`, `data`, `orderBy`, ...).
 *
 * @param {any} options
 * @param {Action} options.action
 * @param {Options['defaultPagination']} options.defaultPagination
 * @param {any} options._arguments
 * @param {any} options._selectionSetList
 * @returns PrismaArgs
 */
export function getPrismaArgs({
    action,
    defaultPagination,
    _arguments,
    _selectionSetList,
}: {
    action: Action
    defaultPagination: Options['defaultPagination']
    _arguments: any
    _selectionSetList: any
}): PrismaArgs {
    const prismaArgs: PrismaArgs = {}

    if (typeof _arguments.data !== 'undefined' && typeof _arguments.operation !== 'undefined') {
        throw new CustomError(`Using 'data' and 'operation' together is not possible.`, {
            type: 'BAD_USER_INPUT',
        })
    }

    if (typeof _arguments.data !== 'undefined') prismaArgs.data = _arguments.data
    else if (typeof _arguments.operation !== 'undefined') prismaArgs.data = _arguments.operation

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
 * #### Returns individual `orderBy` record formatted for Prisma.
 *
 * @param {any} sortObj
 * @returns any
 */
function getOrderBy(sortObj: any): any {
    if (Object.keys(sortObj).length > 1) {
        throw new CustomError(`Wrong 'orderBy' input format.`, { type: 'BAD_USER_INPUT' })
    }

    const key: any = Object.keys(sortObj)[0]
    const value = typeof sortObj[key] === 'object' ? getOrderBy(sortObj[key]) : sortObj[key].toLowerCase()

    return { [key]: value }
}

/**
 * #### Returns Prisma `orderBy` from parsed `event.arguments.orderBy`.
 *
 * @param {any} orderByInputs
 * @returns any[]
 */
function parseOrderBy(orderByInputs: any): any[] {
    const orderByOutput: any = []
    const orderByInputsArray = Array.isArray(orderByInputs) ? orderByInputs : [orderByInputs]
    orderByInputsArray.forEach((orderByInput: any) => {
        orderByOutput.push(getOrderBy(orderByInput))
    })

    return orderByOutput
}

/**
 * #### Returns individual `include` field formatted for Prisma.
 *
 * @param {any} parts
 * @returns any
 */
function getInclude(parts: any): any {
    const field = parts[0]
    const value = parts.length > 1 ? getSelect(parts.splice(1)) : true

    return {
        include: {
            [field]: value,
        },
    }
}

/**
 * #### Returns individual `select` field formatted for Prisma.
 *
 * @param {any} parts
 * @returns any
 */
function getSelect(parts: any): any {
    const field = parts[0]
    const value = parts.length > 1 ? getSelect(parts.splice(1)) : true

    return {
        select: {
            [field]: value,
        },
    }
}

/**
 * #### Return Prisma `select` from parsed `event.arguments.info.selectionSetList`.
 *
 * @param {any} selectionSetList
 * @returns any
 */
function parseSelectionList(selectionSetList: any): any {
    let prismaArgs: any = {}

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

    return typeof prismaArgs.select !== 'undefined' ? prismaArgs.select : {}
}

/**
 * #### Returns req and res paths (`/update/post/title`, `/get/post/date`, ..).
 *
 * @param {any} options
 * @param {Context} options.context
 * @param {any} options.args
 * @param {PrismaArgs} options.prismaArgs
 * @returns string[]
 */
export function getPaths({
    context,
    args,
    prismaArgs,
}: {
    context: Context
    args: any
    prismaArgs: PrismaArgs
}): string[] {
    const paths: string[] = []

    if (context.model === null) {
        for (const key in args) {
            if (Object.prototype.hasOwnProperty.call(args, key)) {
                const value = args[key]
                const objectPaths = isObject(value) ? dotate(value) : { [key]: value }

                for (const key in objectPaths) {
                    const item = key.split('.').join('/')
                    const path = `/${lowerFirst(context.action)}/${lowerFirst(item)}`
                    if (!paths.includes(path)) paths.push(path)
                }
            }
        }
    }

    for (const key in prismaArgs) {
        if (Object.prototype.hasOwnProperty.call(prismaArgs, key)) {
            const value = prismaArgs[key]

            if (key === 'data' && context.model !== null) {
                const inputs: any[] = Array.isArray(value) ? value : [value]

                inputs.forEach((input: any) => {
                    const objectPaths = isObject(input) ? dotate(input) : { [key]: input }

                    for (const key in objectPaths) {
                        const item = key
                            .split('.')
                            .filter((k) => !ReservedPrismaKeys.includes(k))
                            .join('/')
                        const path = `/${lowerFirst(context.action)}/${lowerFirst(context.model!)}/${lowerFirst(item)}`
                        if (!paths.includes(path)) paths.push(path)
                    }
                })
            } else if (key === 'select') {
                const objectPaths = isObject(value) ? dotate(value) : { [key]: value }

                for (const key in objectPaths) {
                    const item = key
                        .split('.')
                        .filter((k) => !ReservedPrismaKeys.includes(k))
                        .join('/')
                    const selectAction = BatchActionsList.includes(context.action) ? Actions.list : Actions.get
                    const path =
                        context.model !== null
                            ? `/${lowerFirst(selectAction)}/${lowerFirst(context.model)}/${lowerFirst(item)}`
                            : `/${lowerFirst(context.action)}/${lowerFirst(item)}`
                    if (!paths.includes(path)) paths.push(path)
                }
            }
        }
    }

    return paths
}
