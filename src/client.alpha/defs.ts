import { Prisma } from '@prisma/client'

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

export type Action = typeof Actions[keyof typeof Actions]

export type ResolverQuery = {
    operation: string
    action: Action | null
    model: Model | null
    fields: string[]
    args: Args
    type: 'Query' | 'Mutation' | 'Subscription'
}

export type Args = {
    where?: any
    data?: any
    orderBy?: any
    skip?: number
    take?: number
}

export const Models = Prisma.ModelName

export type Model = typeof Models[keyof typeof Models]

export type AppsyncEvent = {
    arguments?: any,
    info?: {
        fieldName?: string
        selectionSetList?: string[]
        parentTypeName?: string
    }
}