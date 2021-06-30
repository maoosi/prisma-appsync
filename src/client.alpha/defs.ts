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
    connectionUrl?: string,
    sanitize?: boolean,
    debug?: boolean,
    defaultPagination?: number | false
}

export type ResolveParams = {
    event: AppsyncEvent,
    customResolvers?: {},
    beforeResolve?: () => Promise<void>
    afterResolve?: () => Promise<void>
    shield?: () => Promise<ShieldDirectives>
}

export const Models = Prisma.ModelName

export type Model = typeof Models[keyof typeof Models] | 'custom'

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
    access: [
        Actions.get, 
        Actions.list, 
        Actions.count
    ],
    create: [
        Actions.create,
        Actions.createMany,
    ],
    modify: [
        Actions.upsert,
        Actions.update,
        Actions.updateMany,
        Actions.delete,
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
    ]
} as const

export type Action = typeof Actions[keyof typeof Actions] | string
export type ActionsAlias = keyof typeof ActionsAliases | string

export type GraphQLType = 'Query' | 'Mutation' | 'Subscription'

export type ShieldSubject = {
    actionAlias: ActionsAlias
    model: Model
}

export type ResolverQuery = {
    operation: string
    action: Action
    actionAlias: ActionsAlias
    model: Model
    fields: string[]
    args: Args
    type: GraphQLType
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

export type ShieldDirectivePossibleTypes = Boolean | (() => void) | null

export type ShieldDirectiveParam = 'rule' | 'filter' | 'beforeResolve' | 'afterResolve'

export type ShieldDirective = {
    rule?: Boolean
    filter?: ({ field }:any) => boolean
    beforeResolve?: () => void
    afterResolve?: () => void
}

export type ShieldDirectives = {
    [key in Model] ? : ShieldDirective | {
        [key in ActionsAlias] ? : ShieldDirective
    }
} | {
    '*' ? : ShieldDirective | {
        [key in ActionsAlias] ? : ShieldDirective
    }
} | {
    'custom' ? : ShieldDirective | {
        [key: string]: ShieldDirective
    }
}