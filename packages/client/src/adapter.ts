import { CustomError } from './inspector'
import { sanitize } from './guard'
import {
    clone,
    isEmpty,
    isUndefined,
    lowerFirst,
    merge,
    objectToPaths,
    traverseNodes,
    unique,
} from './utils'
import type {
    Action,
    ActionsAlias,
    AppSyncEvent,
    Authorization,
    Context,
    GraphQLType,
    Identity,
    Model,
    Options,
    PrismaArgs,
    QueryParams,
} from './defs'
import {
    Actions,
    ActionsAliasesList,
    Authorizations,
    BatchActionsList,
    Prisma_ReservedKeysForPaths,
} from './defs'

/**
 * #### Parse AppSync direct resolver `event` and returns Query Params.
 *
 * @param  {AppSyncEvent} appsyncEvent - AppSync event received in Lambda.
 * @param  {Required<PrismaAppSyncOptionsType>} options - PrismaAppSync Client options.
 * @param  {any|null} customResolvers? - Custom Resolvers.
 * @returns `{ type, operation, context, fields, paths, args, prismaArgs, authorization, identity }` - QueryParams
 */
export async function parseEvent(appsyncEvent: AppSyncEvent, options: Options, customResolvers?: any | null): Promise<QueryParams> {
    if (
        isEmpty(appsyncEvent?.info?.fieldName)
        || isUndefined(appsyncEvent?.info?.selectionSetList)
        || isEmpty(appsyncEvent?.info?.parentTypeName)
        || isUndefined(appsyncEvent?.arguments)
    )
        throw new CustomError('Error reading required parameters from appsyncEvent.', { type: 'INTERNAL_SERVER_ERROR' })

    const operation = getOperation({ fieldName: appsyncEvent.info.fieldName })

    const context = getContext({ customResolvers, options, operation })

    const { identity, authorization } = getAuthIdentity({
        appsyncEvent,
    })

    const fields = getFields({
        _selectionSetList: appsyncEvent.info.selectionSetList,
    })
    const sanitizedArgs = options.sanitize
        ? await sanitize(await addNullables(appsyncEvent.arguments))
        : await addNullables(appsyncEvent.arguments)

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
        operation,
        context,
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
 * #### Convert `is: <enum>NULL` and `isNot: <enum>NULL` to `is: null` and `isNot: null`
 *
 * @param {any} data
 * @returns any
 */
export async function addNullables(data: any): Promise<any> {
    return await traverseNodes(data, async (node) => {
        if (typeof node?.key === 'string' && (node?.key === 'is' || node?.key === 'isNot')) {
            node.set(node?.value === 'NULL' ? null : undefined)
            node.break()
        }

        else if (typeof node?.key === 'string' && node?.childKeys?.includes('isNull')) {
            const { isNull, ...value } = node.value

            if (isNull === true)
                node.set({ ...value, equals: null })
            else
                node.set({ ...value, not: null })

            node.break()
        }
    })
}

/**
 * #### Returns authorization and identity.
 *
 * @param {any} options
 * @param {AppSyncEvent} options.appsyncEvent - AppSync event received in Lambda.
 * @returns `{ authorization, identity }`
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html#aws-appsync-resolver-context-reference-identity
 */
export function getAuthIdentity({ appsyncEvent }: { appsyncEvent: AppSyncEvent }): {
    identity: Identity
    authorization: Authorization
} {
    let authorization: Authorization = null
    let identity: Identity = null

    // API_KEY authorization
    if (isEmpty(appsyncEvent?.identity)) {
        authorization = Authorizations.API_KEY
        identity = {
            ...(appsyncEvent?.request?.headers
                && typeof appsyncEvent.request.headers['x-api-key'] !== 'undefined' && {
                requestApiKey: appsyncEvent.request.headers['x-api-key'],
            }),
            ...(appsyncEvent?.request?.headers
                && typeof appsyncEvent.request.headers['user-agent'] !== 'undefined' && {
                requestUserAgent: appsyncEvent.request.headers['user-agent'],
            }),
        }
    }
    // AWS_LAMBDA authorization
    else if (appsyncEvent?.identity && typeof (appsyncEvent.identity as any).resolverContext !== 'undefined') {
        authorization = Authorizations.AWS_LAMBDA
        identity = appsyncEvent.identity
    }
    // AWS_IAM authorization
    else if (
        appsyncEvent?.identity
        && typeof (appsyncEvent.identity as any).cognitoIdentityAuthType !== 'undefined'
        && typeof (appsyncEvent.identity as any).cognitoIdentityAuthProvider !== 'undefined'
        && typeof (appsyncEvent.identity as any).cognitoIdentityPoolId !== 'undefined'
        && typeof (appsyncEvent.identity as any).cognitoIdentityId !== 'undefined'
    ) {
        authorization = Authorizations.AWS_IAM
        identity = appsyncEvent.identity
    }
    // AMAZON_COGNITO_USER_POOLS authorization
    else if (
        appsyncEvent?.identity
        && typeof (appsyncEvent.identity as any).sub !== 'undefined'
        && typeof (appsyncEvent.identity as any).issuer !== 'undefined'
        && typeof (appsyncEvent.identity as any).username !== 'undefined'
        && typeof (appsyncEvent.identity as any).claims !== 'undefined'
        && typeof (appsyncEvent.identity as any).sourceIp !== 'undefined'
        && typeof (appsyncEvent.identity as any).defaultAuthStrategy !== 'undefined'
    ) {
        authorization = Authorizations.AMAZON_COGNITO_USER_POOLS
        identity = appsyncEvent.identity
    }
    // OPENID_CONNECT authorization
    else if (
        appsyncEvent?.identity
        && typeof (appsyncEvent.identity as any).sub !== 'undefined'
        && typeof (appsyncEvent.identity as any).issuer !== 'undefined'
        && typeof (appsyncEvent.identity as any).claims !== 'undefined'
    ) {
        authorization = Authorizations.OPENID_CONNECT
        identity = appsyncEvent.identity
    }
    // ERROR
    else {
        throw new CustomError('Couldn\'t detect caller identity.', {
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
 * @param  {string} options.operation
 * @param  {Options} options.options
 * @returns Context
 */
export function getContext({
    customResolvers,
    operation,
    options,
}: {
    customResolvers?: any | null
    operation: string
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
    }
    else {
        context.action = getAction({ operation })
        context.model = getModel({ operation, action: context.action, options })
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
export function getOperation({ fieldName }: { fieldName: string }): string {
    const operation = fieldName

    if (!(operation.length > 0))
        throw new CustomError('Error parsing \'operation\' from input event.', { type: 'INTERNAL_SERVER_ERROR' })

    return operation
}

/**
 * #### Returns action (`get`, `list`, `create`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @returns Action
 */
export function getAction({ operation }: { operation: string }): Action {
    const actionsList = Object.keys(Actions).sort().reverse()

    const action = actionsList.find((action: Action) => {
        return operation.toLowerCase().startsWith(String(action).toLowerCase())
    }) as Action

    if (!(typeof action !== 'undefined' && String(action).length > 0)) {
        throw new CustomError(
            'Error parsing \'action\' from input event. If you are trying to query a custom resolver, make sure it is properly declared inside \'prismaAppSync.resolve({ event, resolvers: { /* HERE */ } })\'.',
            { type: 'INTERNAL_SERVER_ERROR' },
        )
    }

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

    if (!(typeof action !== 'undefined' && String(action).length > 0))
        throw new CustomError('Error parsing \'actionAlias\' from input event.', { type: 'INTERNAL_SERVER_ERROR' })

    return actionAlias
}

/**
 * #### Returns model (`Post`, `User`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @param  {Action} options.action
 * @param  {Options} options.options
 * @returns Model
 */
export function getModel(
    { operation, action, options }:
    { operation: string; action: Action; options: Options },
): Model {
    const actionModel = operation.replace(String(action), '')

    if (!(actionModel.length > 0))
        throw new CustomError('Error parsing \'model\' from input event.', { type: 'INTERNAL_SERVER_ERROR' })

    const model = options?.modelsMapping?.[actionModel]

    if (!model) {
        throw new CustomError('Issue parsing auto-injected models mapping config.', {
            type: 'INTERNAL_SERVER_ERROR',
        })
    }

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
        if (!fields.includes(field) && !field.startsWith('__'))
            fields.push(item)
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

    if (!['Query', 'Mutation', 'Subscription'].includes(type))
        throw new CustomError('Error parsing \'type\' from input event.', { type: 'INTERNAL_SERVER_ERROR' })

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
        throw new CustomError('Using \'data\' and \'operation\' together is not possible.', {
            type: 'BAD_USER_INPUT',
        })
    }

    if (typeof _arguments.data !== 'undefined')
        prismaArgs.data = _arguments.data
    else if (typeof _arguments.operation !== 'undefined')
        prismaArgs.data = _arguments.operation

    if (typeof _arguments.create !== 'undefined')
        prismaArgs.create = _arguments.create
    if (typeof _arguments.update !== 'undefined')
        prismaArgs.update = _arguments.update
    if (typeof _arguments.where !== 'undefined')
        prismaArgs.where = _arguments.where
    if (typeof _arguments.orderBy !== 'undefined')
        prismaArgs.orderBy = parseOrderBy(_arguments.orderBy)
    if (typeof _arguments.skipDuplicates !== 'undefined')
        prismaArgs.skipDuplicates = _arguments.skipDuplicates

    if (typeof _selectionSetList !== 'undefined')
        prismaArgs.select = parseSelectionList(_selectionSetList)

    if (isEmpty(prismaArgs.select))
        delete prismaArgs.select

    if (typeof _arguments.skip !== 'undefined')
        prismaArgs.skip = parseInt(_arguments.skip)
    else if (defaultPagination !== false && action === Actions.list)
        prismaArgs.skip = 0

    if (typeof _arguments.take !== 'undefined')
        prismaArgs.take = parseInt(_arguments.take)
    else if (defaultPagination !== false && action === Actions.list)
        prismaArgs.take = defaultPagination

    return prismaArgs
}

/**
 * #### Returns individual `orderBy` record formatted for Prisma.
 *
 * @param {any} sortObj
 * @returns any
 */
function getOrderBy(sortObj: any): any {
    if (Object.keys(sortObj).length > 1)
        throw new CustomError('Wrong \'orderBy\' input format.', { type: 'BAD_USER_INPUT' })

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
    let prismaArgs: any = { select: {} }

    for (let i = 0; i < selectionSetList.length; i++) {
        const path = selectionSetList[i]
        const parts = path.split('/')

        if (!parts.includes('__typename')) {
            if (parts.length > 1)
                prismaArgs = merge(prismaArgs, getInclude(parts))
            else
                prismaArgs = merge(prismaArgs, getSelect(parts))
        }
    }

    if (prismaArgs.include) {
        for (const include in prismaArgs.include) {
            if (typeof prismaArgs.select[include] !== 'undefined')
                delete prismaArgs.select[include]
        }

        prismaArgs.select = merge(prismaArgs.select, prismaArgs.include)
        delete prismaArgs.include
    }

    return typeof prismaArgs.select !== 'undefined' ? prismaArgs.select : {}
}

/**
 * #### Returns req and res paths (`updatePost/title`, `getPost/date`, ..).
 *
 * @param {any} options
 * @param {string} options.operation
 * @param {Context} options.context
 * @param {PrismaArgs} options.prismaArgs
 * @returns string[]
 */
export function getPaths({
    operation,
    context,
    prismaArgs,
}: {
    operation: string
    context: Context
    prismaArgs: PrismaArgs
}): string[] {
    const paths: string[] = objectToPaths({
        ...(prismaArgs?.data && {
            data: prismaArgs.data,
        }),
        ...(prismaArgs?.select && {
            select: prismaArgs.select,
        }),
    })

    paths.forEach((path: string, index: number) => {
        if (path.startsWith('data')) {
            paths[index] = path.replace('data', operation)
        }

        else if (path.startsWith('select')) {
            const action = BatchActionsList.includes(context.action) ? Actions.list : Actions.get
            if (context.model !== null) {
                const model = action === Actions.list ? context.model.plural : context.model.singular
                paths[index] = path.replace('select', `${lowerFirst(action)}${model}`)
            }
            else {
                paths[index] = path.replace('select', operation)
            }
        }
    })

    return unique(
        paths.map(
            (path: string) => path
                .split('/')
                .filter(k => !Prisma_ReservedKeysForPaths.includes(k))
                .join('/'),
        ),
    )
}
