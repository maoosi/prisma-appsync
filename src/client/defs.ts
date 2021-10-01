import { PrismaClient, Prisma } from '@prisma/client'

/**
 *
 * TYPES
 *
 */

// Prisma-AppSync Client Types

export interface PrismaAppSyncOptions {
    generatedConfig?: any
    connectionString?: string
    sanitize?: boolean
    debug?: boolean
    defaultPagination?: number | false
    maxDepth?: number
}

export type Action = typeof Actions[keyof typeof Actions] | string

export type ActionsAlias = keyof typeof ActionsAliases | null

export type Operation = `${Action}${Capitalize<Model>}`

export interface Context {
    action: Action
    alias: Action | 'custom' | null
    model: Model | null
}

export interface QueryParams {
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

export type QueryParamsBefore = QueryParams & {
    prismaClient: PrismaClient
}

export type QueryParamsAfter = QueryParams & {
    prismaClient: PrismaClient
    result: any | any[]
}

export interface Shield {
    [matcher: string]:
        | boolean
        | {
              rule: boolean | object
              reason?: string | Function
          }
}
export interface HooksProps {
    before: QueryParamsBefore
    after: QueryParamsAfter
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

export interface ShieldAuthorization {
    canAccess: boolean
    reason: string | Function
    prismaFilter: object
    matcher: string
}

export interface ResolveParams<CustomResolvers extends string> {
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

export interface PrismaArgs {
    where?: any
    data?: any
    orderBy?: any
    skip?: number
    take?: number
    skipDuplicates?: boolean
    select?: any
}

// AppSync-related Types

export interface AppsyncEvent {
    arguments: any
    source: any
    identity: AppSyncIdentity
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

export type API_KEY = null

export interface AWS_LAMBDA {
    resolverContext: any
}

export interface AWS_IAM {
    accountId: string
    cognitoIdentityPoolId: string
    cognitoIdentityId: string
    sourceIp: string[]
    username: string
    userArn: string
    cognitoIdentityAuthType: string
    cognitoIdentityAuthProvider: string
}

export interface AMAZON_COGNITO_USER_POOLS {
    sub: string
    issuer: string
    username: string
    claims: any
    sourceIp: string[]
    defaultAuthStrategy: string
    groups: string[]
}

export interface AWS_OIDC {
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
}

export type AppSyncIdentity = API_KEY | AWS_LAMBDA | AWS_IAM | AMAZON_COGNITO_USER_POOLS | AWS_OIDC

export type Identity = AppSyncIdentity & {
    [key: string]: any
}

/**
 *
 * CONSTS
 *
 */

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

export const Actions = {
    // queries
    get: 'get',
    list: 'list',
    count: 'count',

    // mutations (multiple)
    createMany: 'createMany',
    updateMany: 'updateMany',
    deleteMany: 'deleteMany',

    // mutations (single)
    create: 'create',
    update: 'update',
    upsert: 'upsert',
    delete: 'delete',

    // subscriptions (multiple)
    onCreatedMany: 'onCreatedMany',
    onUpdatedMany: 'onUpdatedMany',
    onDeletedMany: 'onDeletedMany',
    onMutatedMany: 'onMutatedMany',

    // subscriptions (single)
    onCreated: 'onCreated',
    onUpdated: 'onUpdated',
    onUpserted: 'onUpserted',
    onDeleted: 'onDeleted',
    onMutated: 'onMutated',
} as const

export const ActionsAliases = {
    access: 'access',
    batchAccess: 'batchAccess',
    create: 'create',
    batchCreate: 'batchCreate',
    delete: 'delete',
    batchDelete: 'batchDelete',
    modify: 'modify',
    batchModify: 'modify',
    subscribe: 'subscribe',
    batchSubscribe: 'subscribe',
} as const

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

export const Authorizations = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS',
    AWS_LAMBDA: 'AWS_LAMBDA',
    AWS_OIDC: 'AWS_OIDC',
} as const
