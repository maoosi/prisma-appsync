import { PrismaClient, Prisma } from '@prisma/client'

export { PrismaClient }

export type AppsyncEvent = {
    arguments?: any,
    info?: {
        fieldName?: string
        selectionSetList?: string[]
        parentTypeName?: string
    }
}

export type PrismaAppSyncOptions = {
    generatedConfig?: any,
    connectionString?: string,
    sanitize?: boolean,
    debug?: boolean,
    defaultPagination?: number | false
    maxDepth?: number
}

export type ResolveParams = {
    event: AppsyncEvent,
    resolvers?: object,
    shield?: (ResolverQuery) => Shield
    hooks?: (ResolverQuery) => Hooks
}

export const ReservedPrismaKeys = [
    'data', 'where', 'orderBy', 'create', 'connect', 'connectOrCreate', 'update', 'upsert', 'delete', 'disconnect', 'set', 'updateMany', 'deleteMany', 'select', 'include'
]

export const Models = Prisma.ModelName

export type Model = typeof Models[keyof typeof Models]

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
    access: [
        Actions.get, 
        Actions.list,
        Actions.count
    ],
    batchAccess: [
        Actions.list,
        Actions.count
    ],
    create: [
        Actions.create,
        Actions.createMany,
    ],
    batchCreate: [
        Actions.createMany,
    ],
    modify: [
        Actions.upsert,
        Actions.update,
        Actions.updateMany,
        Actions.delete,
        Actions.deleteMany,
    ],
    batchModify: [
        Actions.updateMany,
        Actions.deleteMany,
    ],
    delete: [
        Actions.delete,
        Actions.deleteMany,
    ],
    batchDelete: [
        Actions.deleteMany,
    ],
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
    batchSubscribe: [
        Actions.onCreatedMany,
        Actions.onUpdatedMany,
        Actions.onDeletedMany,
        Actions.onMutatedMany,
    ]
} as const

let actionsListMultiple:Action[] = []
let actionsListSingle:Action[] = []
for (const actionAlias in ActionsAliasesList) {
    if (actionAlias.startsWith('batch')) {
        actionsListMultiple = actionsListMultiple.concat(ActionsAliasesList[actionAlias])
    } else {
        actionsListSingle = actionsListSingle.concat(ActionsAliasesList[actionAlias])
    }
}
export const ActionsList = actionsListSingle.filter((item, pos) => actionsListSingle.indexOf(item) === pos)
export const BatchActionsList = actionsListMultiple.filter((item, pos) => actionsListMultiple.indexOf(item) === pos)

export type Action = typeof Actions[keyof typeof Actions] | string
export type ActionsAlias = keyof typeof ActionsAliases

export type GraphQLType = 'Query' | 'Mutation' | 'Subscription'

export type Subject = {
    actionAlias: ActionsAlias
    model: Model
} | string

export type ResolverQuery = {
    operation: string
    action: Action
    subject: Subject
    fields: string[]
    args: Args
    type: GraphQLType,
    authIdentity: AuthIdentity
    paths: string[]
}

export const AuthModes = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS'
} as const

export type AuthIdentity = {
    authorization: typeof AuthModes[keyof typeof AuthModes]
    [key:string]: any
}

export type Args = {
    where?: any
    data?: any
    orderBy?: any
    skip?: number
    take?: number
    skipDuplicates?: boolean
    select?: any
}

export type Shield = {
    [matcher: string]: {
        rule: boolean | object
        reason?: string | Function
    } | boolean
}

export type Hooks = {
    [matcher: string]: Function
}

export type Authorization = {
    canAccess: boolean
    reason: string | Function
    prismaFilter: object
    matcher: string
}