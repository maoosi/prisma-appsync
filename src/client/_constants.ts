export const PrismaExclWords = [
    'data', 'where', 'orderBy', 'create', 'connect', 'connectOrCreate', 'update', 'upsert', 'delete', 'disconnect', 'set', 'updateMany', 'deleteMany', 'select', 'include'
]

export const AuthModes = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS'
} as const

export const CrudOperations = {
    get: 'get',
    list: 'list',
    createMany: 'createMany', // createMany always comes before create
    create: 'create',
    upsert: 'upsert',
    updateMany: 'updateMany', // updateMany always comes before update
    update: 'update',
    deleteMany: 'deleteMany', // deleteMany always comes before delete
    delete: 'delete',
    count: 'count'
} as const

export const Operations = Object.assign({}, CrudOperations, {
    custom: 'custom',
} as const)

export const AuthActions = Object.assign({}, Operations, {
    all: 'all', // alias to: everything
    manage: 'manage', // alias to: everything
    access: 'access', // alias to: get + list
    modify: 'modify', // alias to: upsert + update + delete
} as const)

export const PrismaAppSyncOperations = Object.keys(CrudOperations).map((k:any) => k)
