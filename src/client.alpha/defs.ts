import { Prisma } from '@prisma/client'

export type AppsyncEvent = {
    arguments?: any,
    info?: {
        fieldName?: string
        selectionSetList?: string[]
        parentTypeName?: string
    }
}

export type PrismaAppSyncOptions = {
    event: AppsyncEvent,
    customResolvers?: {},
    beforeResolve?: () => Promise<void>
    afterResolve?: () => Promise<void>
    shield?: () => Promise<Shield>
}

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

export type Action = typeof Actions[keyof typeof Actions]
export type ActionsAlias = keyof typeof ActionsAliases

export type GraphQLType = 'Query' | 'Mutation' | 'Subscription'

export type ShieldSubject = string | {
    action: ActionsAlias
    model: Model
}

export type ResolverQuery = {
    operation: string
    action: Action
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
}

export type ShieldDirectiveParam = 'rule' | 'filter' | 'afterResolve'

export type ShieldDirective = {
    rule?: Boolean
    filter?: ({ field }:any) => boolean
    afterResolve?: () => void
}

export type Shield = {
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