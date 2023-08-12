import type { Action } from './types'
import { unique } from './utils'

// Enums

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

// Consts

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
