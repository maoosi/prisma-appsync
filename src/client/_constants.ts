export const prismaAppSyncOperations = [
    'get',
    'list',
    'create',
    'update',
    'upsert',
    'deleteMany', // deleteMany always comes before delete
    'delete'
]

export const prismaCombinators = [
    'AND', 'NOT', 'OR'
]

export const prismaOperators = [
    'equals', 'not', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith'
]

export const prismaOrderByArgs = [
    'asc', 'desc'
]

export const prismaExclWords = [
    'data', 'where', 'orderBy', 'create', 'connect', 'connectOrCreate', 'update', 'upsert', 'delete', 'disconnect', 'set', 'updateMany', 'deleteMany', 'select', 'include'
]

export const AuthModes = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS'
} as const

export const AuthActions = {
    all: 'all', // alias to: everything
    manage: 'manage', // alias to: everything
    access: 'access', // alias to: get + list
    modify: 'modify', // alias to: upsert + update + delete
    custom: 'custom',
    get: 'get',
    list: 'list',
    create: 'create',
    upsert: 'upsert',
    update: 'update',
    delete: 'delete',
    deleteMany: 'deleteMany',
} as const
