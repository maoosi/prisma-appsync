import { PrismaClient, Prisma } from '@prisma/client'

// Prisma-AppSync Client Types

export type PrismaAppSyncOptions = {
    connectionString?: string
    sanitize?: boolean
    debug?: boolean
    defaultPagination?: number | false
    maxDepth?: number
}

export type Options = Required<PrismaAppSyncOptions> & {
    generatedConfig: any
}

export type Action = typeof Actions[keyof typeof Actions] | string

export type ActionsAlias = keyof typeof ActionsAliases | null

export type Operation = `${Action}${Capitalize<Model>}`

export type Context = {
    action: Action
    alias: Action | 'custom' | null
    model: Model | null
}

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
export type QueryParams = {
    type: GraphQLType
    operation: Operation | string
    context: Context
    fields: string[]
    paths: string[]
    args: any
    prismaArgs: PrismaArgs
    authorization: Authorization
    identity: Identity
}

export type Authorization = typeof Authorizations[keyof typeof Authorizations] | null

export type QueryParamsCustom = QueryParams & {
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

export type Shield = {
    [matcher: string]:
        | boolean
        | {
              rule: boolean | any
              reason?: string | Function
          }
}

export type HooksProps = {
    before: BeforeHookParams
    after: AfterHookParams
}

export type HookPath<CustomResolvers> = `${Lowercase<NonNullable<ActionsAlias>>}/${Lowercase<Model>}` | CustomResolvers

export type HooksParameter<
    HookType extends 'before' | 'after',
    CustomResolvers extends string,
> = `${HookType}:${HookPath<CustomResolvers>}`

export type HooksParameters<HookType extends 'before' | 'after', CustomResolvers extends string> = {
    [matcher in HooksParameter<HookType, CustomResolvers>]?: (props: HooksProps[HookType]) => Promise<any>
}

export type Hooks<CustomResolvers extends string> =
    | HooksParameters<'before', CustomResolvers>
    | HooksParameters<'after', CustomResolvers>

export type ShieldAuthorization = {
    canAccess: boolean
    reason: string | Function
    prismaFilter: any
    matcher: string
}

export type ResolveParams<CustomResolvers extends string> = {
    event: AppsyncEvent
    resolvers?: {
        [resolver in CustomResolvers]: ((props: QueryParamsCustom) => Promise<any>) | boolean
    }
    shield?: (props: QueryParams) => Shield
    hooks?: () => Hooks<CustomResolvers>
}

// Prisma-related Types

export { PrismaClient }

export type Model = typeof Models[keyof typeof Models]

export type PrismaArgs = {
    where?: any
    data?: any
    orderBy?: any
    skip?: number
    take?: number
    skipDuplicates?: boolean
    select?: any
}

// AppSync-related Types

export type AppsyncEvent = {
    arguments: any
    source: any
    identity: Identity
    request: any
    info: {
        fieldName: string
        parentTypeName: string
        variables: any
        selectionSetList: string[]
        selectionSetGraphQL: string
    }
    prev: {
        result: any
    }
    stash: any
}

export type GraphQLType = 'Query' | 'Mutation' | 'Subscription'

export type API_KEY = null | {
    [key: string]: any
}

export type AWS_LAMBDA = {
    resolverContext: any
    [key: string]: any
}

export type AWS_IAM = {
    accountId: string
    cognitoIdentityPoolId: string
    cognitoIdentityId: string
    sourceIp: string[]
    username: string
    userArn: string
    cognitoIdentityAuthType: string
    cognitoIdentityAuthProvider: string
    [key: string]: any
}

export type AMAZON_COGNITO_USER_POOLS = {
    sub: string
    issuer: string
    username: string
    claims: any
    sourceIp: string[]
    defaultAuthStrategy: string
    groups: string[]
    [key: string]: any
}

export type OPENID_CONNECT = {
    claims: {
        sub: string
        aud: string
        azp: string
        iss: string
        exp: number
        iat: number
        gty: string
    }
    sourceIp: string[]
    issuer: string
    sub: string
    [key: string]: any
}

export type Identity = API_KEY | AWS_LAMBDA | AWS_IAM | AMAZON_COGNITO_USER_POOLS | OPENID_CONNECT

// Prisma-related Constants

export const Models = Prisma.ModelName

export const ReservedPrismaKeys = [
    'data',
    'where',
    'orderBy',
    'create',
    'connect',
    'connectOrCreate',
    'update',
    'upsert',
    'delete',
    'disconnect',
    'set',
    'updateMany',
    'deleteMany',
    'select',
    'include',
]

// Prisma-AppSync Client Constants

export enum Actions {
    // queries
    get,
    list,
    count,

    // mutations (multiple)
    createMany,
    updateMany,
    deleteMany,

    // mutations (single)
    create,
    update,
    upsert,
    delete,

    // subscriptions (multiple)
    onCreatedMany,
    onUpdatedMany,
    onDeletedMany,
    onMutatedMany,

    // subscriptions (single)
    onCreated,
    onUpdated,
    onUpserted,
    onDeleted,
    onMutated,
}

export enum ActionsAliases {
    access,
    batchAccess,
    create,
    batchCreate,
    delete,
    batchDelete,
    modify,
    batchModify,
    subscribe,
    batchSubscribe,
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
    if (actionAlias.startsWith('batch')) {
        actionsListMultiple = actionsListMultiple.concat(ActionsAliasesList[actionAlias])
    } else {
        actionsListSingle = actionsListSingle.concat(ActionsAliasesList[actionAlias])
    }
}

export const ActionsList = actionsListSingle.filter((item, pos) => actionsListSingle.indexOf(item) === pos)

export const BatchActionsList = actionsListMultiple.filter((item, pos) => actionsListMultiple.indexOf(item) === pos)

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
    API_KEY,
    AWS_IAM,
    AMAZON_COGNITO_USER_POOLS,
    AWS_LAMBDA,
    OPENID_CONNECT,
}
