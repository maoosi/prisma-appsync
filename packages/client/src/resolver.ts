import type {
    PrismaArgs,
    PrismaClient,
    PrismaCount,
    PrismaCreate,
    PrismaCreateMany,
    PrismaDelete,
    PrismaDeleteMany,
    PrismaGet,
    PrismaList,
    PrismaOperator,
    PrismaUpdate,
    PrismaUpdateMany,
    PrismaUpsert,
    QueryBuilder,
    QueryParams,
} from './defs'
import { merge } from './utils'

/**
 *  #### Query Builder
 */
export function prismaQueryJoin<T>(queries: PrismaArgs[], operators: PrismaOperator[]): T {
    const prismaArgs: PrismaArgs = {}

    // 'where', 'orderBy', 'select', 'skip', 'take', ...
    operators.forEach((operator: PrismaOperator) => {
        queries.forEach((query: PrismaArgs) => {
            if (query?.[operator]) {
                if (operator === 'where') {
                    if (prismaArgs.where?.AND) {
                        prismaArgs.where.AND.push(query.where)
                    }
                    else if (prismaArgs.where) {
                        prismaArgs.where = {
                            ...prismaArgs.where,
                            AND: [query.where],
                        }
                    }
                    else {
                        prismaArgs.where = query.where
                    }
                }
                else if (prismaArgs?.[operator]) {
                    prismaArgs[operator] = merge(prismaArgs[operator], query[operator]) as never
                }
                else {
                    prismaArgs[operator] = query[operator] as never
                }
            }
        })
    })

    return prismaArgs as T
}

export const queryBuilder: QueryBuilder = {
    prismaGet: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaGet>(prismaQueries, ['where', 'select'])
    },
    prismaList: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaList>(prismaQueries, ['where', 'orderBy', 'select', 'skip', 'take'])
    },
    prismaCount: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaCount>(prismaQueries, ['where', 'orderBy', 'select', 'skip', 'take'])
    },
    prismaCreate: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaCreate>(prismaQueries, ['data', 'select'])
    },
    prismaCreateMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaCreateMany>(prismaQueries, ['data', 'skipDuplicates'])
    },
    prismaUpdate: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaUpdate>(prismaQueries, ['data', 'where', 'select'])
    },
    prismaUpdateMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaUpdateMany>(prismaQueries, ['data', 'where'])
    },
    prismaUpsert: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaUpsert>(prismaQueries, ['where', 'create', 'update', 'select'])
    },
    prismaDelete: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaDelete>(prismaQueries, ['where', 'select'])
    },
    prismaDeleteMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin<PrismaDeleteMany>(prismaQueries, ['where'])
    },
}

/**
 *  #### Query :: Find Unique
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function getQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].findUnique(queryBuilder.prismaGet(query.prismaArgs))

    return results
}

/**
 * #### Query :: Find Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function listQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].findMany(queryBuilder.prismaList(query.prismaArgs))

    return results
}

/**
 * #### Query :: Count
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#count
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function countQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].count(queryBuilder.prismaCount(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Create
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function createQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].create(queryBuilder.prismaCreate(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Create Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function createManyQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].createMany(queryBuilder.prismaCreateMany(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Update
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function updateQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].update(queryBuilder.prismaUpdate(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Update Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#updatemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function updateManyQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].updateMany(queryBuilder.prismaUpdateMany(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Upsert
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function upsertQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].upsert(queryBuilder.prismaUpsert(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Delete
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function deleteQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].delete(queryBuilder.prismaDelete(query.prismaArgs))

    return results
}

/**
 * #### Mutation :: Delete Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#deletemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function deleteManyQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null)
        return

    const results = await prismaClient[query.context.model.prismaRef].deleteMany(queryBuilder.prismaDeleteMany(query.prismaArgs))

    return results
}
