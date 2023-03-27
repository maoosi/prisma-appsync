import { Prisma, PrismaClient } from '@prisma/client'
import type {
    AppSyncIdentity,
    AppSyncIdentityCognito,
    AppSyncIdentityIAM,
    AppSyncIdentityLambda,
    AppSyncIdentityOIDC,
    AppSyncResolverEvent,
    AppSyncResolverHandler,
} from 'aws-lambda'
import { unique } from './utils'

// Prisma-AppSync Client Types

export type logLevel = 'INFO' | 'WARN' | 'ERROR'

export interface PrismaAppSyncOptionsType {
    connectionString?: string
    sanitize?: boolean
    logLevel?: logLevel
    defaultPagination?: number | false
    maxDepth?: number
    maxReqPerUserMinute?: number | false
}

export type Options = Required<PrismaAppSyncOptionsType> & {
    modelsMapping: any
    fieldsMapping: any
}

export interface InjectedConfig {
    modelsMapping?: { [modelVariant: string]: { prismaRef: string; singular: string; plural: string } }
    fieldsMapping?: { [fieldPath: string]: { type: string; isRelation: boolean } }
    operations?: string
}

export type Action = typeof Actions[keyof typeof Actions] | string

export type ActionsAlias = typeof ActionsAliases[keyof typeof ActionsAliases] | 'custom' | null

export type ActionsAliasStr = keyof typeof ActionsAliases

export interface Context {
    action: Action
    alias: ActionsAlias
    model: Model
}

export type Model = { prismaRef: string; singular: string; plural: string } | null

export type { AppSyncResolverHandler, AppSyncResolverEvent, AppSyncIdentity }

/**
 * ### QueryParams
 *
 * @example
 * ```
 * {
 *     type: 'Query',
 *     operation: 'getPost',
 *     context: { action: 'get', alias: 'access', model: 'Post' },
 *     fields: ['title', 'status'],
 *     paths: ['get/post/title', 'get/post/status'],
 *     args: { where: { id: 5 } },
 *     prismaArgs: {
 *         where: { id: 5 },
 *         select: { title: true, status: true },
 *     },
 *     authorization: 'API_KEY',
 *     identity: { ... },
 * }
 * ```
 */
export interface QueryParams<T = any> {
    type: GraphQLType
    operation: string
    context: Context
    fields: string[]
    paths: string[]
    args: T
    prismaArgs: PrismaArgs
    authorization: Authorization
    identity: Identity
    headers: any
}

export type Authorization = typeof Authorizations[keyof typeof Authorizations] | null

export type PrismaGet = Pick<Required<PrismaArgs>, 'where'> & Pick<PrismaArgs, 'select'>
export type PrismaList = Pick<PrismaArgs, 'where' | 'orderBy' | 'select' | 'skip' | 'take'>
export type PrismaCount = Pick<PrismaArgs, 'where' | 'orderBy' | 'select' | 'skip' | 'take'>
export type PrismaCreate = Pick<Required<PrismaArgs>, 'data'> & Pick<PrismaArgs, 'select'>
export type PrismaCreateMany = Pick<Required<PrismaArgs>, 'data'> & Pick<PrismaArgs, 'skipDuplicates'>
export type PrismaUpdate = Pick<Required<PrismaArgs>, 'data' | 'where'> & Pick<PrismaArgs, 'select'>
export type PrismaUpdateMany = Pick<Required<PrismaArgs>, 'data' | 'where'>
export type PrismaUpsert = Pick<Required<PrismaArgs>, 'where'> &
Pick<PrismaArgs, 'select'> & Pick<PrismaArgs, 'update'> & Pick<PrismaArgs, 'create'>
export type PrismaDelete = Pick<Required<PrismaArgs>, 'where'> & Pick<PrismaArgs, 'select'>
export type PrismaDeleteMany = Pick<Required<PrismaArgs>, 'where'>

export interface QueryBuilder {
    prismaGet: (...prismaArgs: PrismaArgs[]) => PrismaGet
    prismaList: (...prismaArgs: PrismaArgs[]) => PrismaList
    prismaCount: (...prismaArgs: PrismaArgs[]) => PrismaCount
    prismaCreate: (...prismaArgs: PrismaArgs[]) => PrismaCreate
    prismaCreateMany: (...prismaArgs: PrismaArgs[]) => PrismaCreateMany
    prismaUpdate: (...prismaArgs: PrismaArgs[]) => PrismaUpdate
    prismaUpdateMany: (...prismaArgs: PrismaArgs[]) => PrismaUpdateMany
    prismaUpsert: (...prismaArgs: PrismaArgs[]) => PrismaUpsert
    prismaDelete: (...prismaArgs: PrismaArgs[]) => PrismaDelete
    prismaDeleteMany: (...prismaArgs: PrismaArgs[]) => PrismaDeleteMany
}

export type QueryParamsCustom<T = any> = QueryParams<T> & {
    prismaClient: PrismaClient
}

export type BeforeHookParams = QueryParams & {
    prismaClient: PrismaClient
}

/**
 * ### AfterHookParams
 *
 * @example
 * ```
 * {
 *     type: 'Query',
 *     operation: 'getPost',
 *     context: { action: 'get', alias: 'access', model: 'Post' },
 *     fields: ['title', 'status'],
 *     paths: ['get/post/title', 'get/post/status'],
 *     args: { where: { id: 5 } },
 *     prismaArgs: {
 *         where: { id: 5 },
 *         select: { title: true, status: true },
 *     },
 *     authorization: 'API_KEY',
 *     identity: { ... },
 *     result: { title: 'Hello World', status: 'PUBLISHED' }
 * }
 * ```
 */
export type AfterHookParams = QueryParams & {
    prismaClient: PrismaClient
    result: any | any[]
}

export interface ShieldContext {
    action: Action
    model: string
}

export type Reason = string | ((context: ShieldContext) => string)

export type ShieldRule = boolean | ((context: ShieldContext) => boolean | Promise<boolean>) | any

export interface Shield {
    [matcher: string]:
    | boolean
    | {
        rule: ShieldRule
        reason?: Reason
    }
}

export interface HooksProps {
    before: BeforeHookParams
    after: AfterHookParams
}

export interface HooksReturn {
    before: Promise<BeforeHookParams>
    after: Promise<AfterHookParams>
}

export type HookPath<Operations extends string, CustomResolvers> = Operations | CustomResolvers

export type HooksParameter<
    HookType extends 'before' | 'after',
    Operations extends string,
    CustomResolvers extends string,
> = `${HookType}:${HookPath<Operations, CustomResolvers>}` | `${HookType}:**`

export type HooksParameters<
    HookType extends 'before' | 'after',
    Operations extends string,
    CustomResolvers extends string,
> = {
    [matcher in HooksParameter<HookType, Operations, CustomResolvers>]?: (
        props: HooksProps[HookType],
    ) => HooksReturn[HookType]
}

export type Hooks<Operations extends string, CustomResolvers extends string> =
    | HooksParameters<'before', Operations, CustomResolvers>
    | HooksParameters<'after', Operations, CustomResolvers>

export interface ShieldAuthorization {
    canAccess: boolean
    reason: Reason
    prismaFilter: any
    matcher: string
    globPattern: string
}

export interface ResolveParams<Operations extends string, CustomResolvers extends string> {
    event: AppSyncEvent
    resolvers?: {
        [resolver in CustomResolvers]: ((props: QueryParamsCustom) => Promise<any>) | boolean
    }
    shield?: (props: QueryParams) => Shield
    hooks?: Hooks<Operations, CustomResolvers>
}

// Prisma-related Types

export { PrismaClient, Prisma }

export interface PrismaArgs {
    where?: any
    create?: any
    update?: any
    data?: any
    select?: any
    orderBy?: any
    skip?: number | undefined
    take?: number | undefined
    skipDuplicates?: boolean | undefined
}

export type PrismaOperator = keyof Required<PrismaArgs>

// AppSync-related Types

export type AppSyncEvent = AppSyncResolverEvent<any>

export type GraphQLType = 'Query' | 'Mutation' | 'Subscription'

export type API_KEY = null | {
    [key: string]: any
}

export type AWS_LAMBDA = AppSyncIdentityLambda

export type AWS_IAM = AppSyncIdentityIAM

export type AMAZON_COGNITO_USER_POOLS = AppSyncIdentityCognito

export type OPENID_CONNECT = AppSyncIdentityOIDC

export type Identity = API_KEY | AWS_LAMBDA | AWS_IAM | AMAZON_COGNITO_USER_POOLS | OPENID_CONNECT

// Prisma-related Constants

export const Prisma_QueryOptions = [
    'where', 'data', 'select', 'orderBy', 'include', 'distinct',
]

export const Prisma_NestedQueries = [
    'create', 'createMany', 'set', 'connect', 'connectOrCreate', 'disconnect', 'update', 'upsert', 'delete', 'updateMany', 'deleteMany',
]

export const Prisma_FilterConditionsAndOperatos = [
    'equals', 'not', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains', 'search', 'mode', 'startsWith', 'endsWith', 'AND', 'OR', 'NOT',
]

export const Prisma_FilterRelationFilters = [
    'some', 'every', 'none', 'is', 'isNot',
]

export const Prisma_ScalarListMethods = [
    'set', 'push', 'unset',
]

export const Prisma_ScalarListFilters = [
    'has', 'hasEvery', 'hasSome', 'isEmpty', 'isSet', 'equals',
]

export const Prisma_CompositeTypeMethods = [
    'set', 'unset', 'update', 'upsert', 'push',
]

export const Prisma_CompositeTypeFilters = [
    'equals', 'is', 'isNot', 'isEmpty', 'every', 'some', 'none',
]

export const Prisma_AtomicNumberOperations = [
    'increment', 'decrement', 'multiply', 'divide', 'set',
]

export const Prisma_JSONFilters = [
    'path', 'string_contains', 'string_starts_with', 'string_ends_with', 'array_contains', 'array_starts_with', 'array_ends_with',
]

export const Prisma_ReservedKeysForPaths = unique([
    ...Prisma_QueryOptions,
    ...Prisma_FilterConditionsAndOperatos,
    ...Prisma_FilterRelationFilters,
    ...Prisma_ScalarListFilters,
    ...Prisma_CompositeTypeFilters,
    ...Prisma_JSONFilters,
])

export const Prisma_ReservedKeys = unique([
    ...Prisma_QueryOptions,
    ...Prisma_NestedQueries,
    ...Prisma_FilterConditionsAndOperatos,
    ...Prisma_FilterRelationFilters,
    ...Prisma_ScalarListMethods,
    ...Prisma_ScalarListFilters,
    ...Prisma_CompositeTypeMethods,
    ...Prisma_CompositeTypeFilters,
    ...Prisma_AtomicNumberOperations,
    ...Prisma_JSONFilters,
])

// Prisma-AppSync Client Constants

export enum Actions {
    // queries
    get = 'get',
    list = 'list',
    count = 'count',

    // mutations (multiple)
    createMany = 'createMany',
    updateMany = 'updateMany',
    deleteMany = 'deleteMany',

    // mutations (single)
    create = 'create',
    update = 'update',
    upsert = 'upsert',
    delete = 'delete',

    // subscriptions (multiple)
    onCreatedMany = 'onCreatedMany',
    onUpdatedMany = 'onUpdatedMany',
    onDeletedMany = 'onDeletedMany',
    onMutatedMany = 'onMutatedMany',

    // subscriptions (single)
    onCreated = 'onCreated',
    onUpdated = 'onUpdated',
    onUpserted = 'onUpserted',
    onDeleted = 'onDeleted',
    onMutated = 'onMutated',
}

export enum ActionsAliases {
    access = 'access',
    batchAccess = 'batchAccess',
    create = 'create',
    batchCreate = 'batchCreate',
    delete = 'delete',
    batchDelete = 'batchDelete',
    modify = 'modify',
    batchModify = 'batchModify',
    subscribe = 'subscribe',
    batchSubscribe = 'batchSubscribe',
}

export const ActionsAliasesList = {
    access: [Actions.get, Actions.list, Actions.count],
    batchAccess: [Actions.list, Actions.count],
    create: [Actions.create, Actions.createMany],
    batchCreate: [Actions.createMany],
    modify: [Actions.upsert, Actions.update, Actions.updateMany, Actions.delete, Actions.deleteMany],
    batchModify: [Actions.updateMany, Actions.deleteMany],
    delete: [Actions.delete, Actions.deleteMany],
    batchDelete: [Actions.deleteMany],
    subscribe: [
        Actions.onCreatedMany,
        Actions.onUpdatedMany,
        Actions.onDeletedMany,
        Actions.onMutatedMany,
        Actions.onCreated,
        Actions.onUpdated,
        Actions.onUpserted,
        Actions.onDeleted,
        Actions.onMutated,
    ],
    batchSubscribe: [Actions.onCreatedMany, Actions.onUpdatedMany, Actions.onDeletedMany, Actions.onMutatedMany],
} as const

let actionsListMultiple: Action[] = []
let actionsListSingle: Action[] = []

for (const actionAlias in ActionsAliasesList) {
    if (actionAlias.startsWith('batch'))
        actionsListMultiple = actionsListMultiple.concat(ActionsAliasesList[actionAlias])

    else
        actionsListSingle = actionsListSingle.concat(ActionsAliasesList[actionAlias])
}

export const ActionsList = actionsListSingle.filter((item, pos) => actionsListSingle.indexOf(item) === pos)

export const BatchActionsList = actionsListMultiple.filter((item, pos) => actionsListMultiple.indexOf(item) === pos)

export const DebugTestingKey = '__prismaAppsync'

/**
 * ### Authorizations
 *
 * - `API_KEY`: Via hard-coded API key passed into `x-api-key` header.
 * - `AWS_IAM`: Via IAM identity and associated IAM policy rules.
 * - `AMAZON_COGNITO_USER_POOLS`: Via Amazon Cognito user token.
 * - `AWS_LAMBDA`: Via an AWS Lambda function.
 * - `OPENID_CONNECT`: Via Open ID connect such as Auth0.
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
 */
export enum Authorizations {
    API_KEY = 'API_KEY',
    AWS_IAM = 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
    AWS_LAMBDA = 'AWS_LAMBDA',
    OPENID_CONNECT = 'OPENID_CONNECT',
}
