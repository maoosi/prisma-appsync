import { PrismaClient, QueryParams, PrismaArgs, QueryBuilder, PrismaOperator } from './defs'
import { merge } from './utils'

/**
 *  #### Query Builder
 */
export function prismaQueryJoin(queries: PrismaArgs[], operators: PrismaOperator[]): PrismaArgs {
    const prismaArgs: PrismaArgs = {}

    operators.forEach((operator: PrismaOperator) => {
        queries.forEach((query: PrismaArgs) => {
            if (query?.[operator]) {
                if (operator === 'where') {
                    if (prismaArgs[operator]?.AND) {
                        prismaArgs[operator].AND.push(query[operator])
                    } else if (prismaArgs[operator]) {
                        prismaArgs[operator] = {
                            AND: [prismaArgs[operator], query[operator]],
                        }
                    } else {
                        prismaArgs[operator] = query[operator]
                    }
                } else if (prismaArgs?.[operator]) {
                    prismaArgs[operator] = merge(prismaArgs[operator], query[operator]) as never
                } else {
                    prismaArgs[operator] = query[operator] as never
                }
            }
        })
    })

    return prismaArgs
}
export const queryBuilder: QueryBuilder = {
    prismaGet: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['where', 'select'])
    },
    prismaList: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['where', 'orderBy', 'select', 'skip', 'take'])
    },
    prismaCount: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['where', 'orderBy', 'select', 'skip', 'take'])
    },
    prismaCreate: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['data', 'select'])
    },
    prismaCreateMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['data', 'skipDuplicates'])
    },
    prismaUpdate: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['data', 'where', 'select'])
    },
    prismaUpdateMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['data', 'where'])
    },
    prismaUpsert: (...prismaQueries: PrismaArgs[]) => {
        const prismaArgs = prismaQueryJoin(prismaQueries, ['data', 'where', 'select'])

        return {
            update: prismaArgs.data,
            create: prismaArgs.data,
            where: prismaArgs.where,
            ...(prismaArgs.select && { select: prismaArgs.select }),
        }
    },
    prismaDelete: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['where', 'select'])
    },
    prismaDeleteMany: (...prismaQueries: PrismaArgs[]) => {
        return prismaQueryJoin(prismaQueries, ['where'])
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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].findUnique(queryBuilder.prismaGet(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].findMany(queryBuilder.prismaList(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].count(queryBuilder.prismaCount(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].create(queryBuilder.prismaCreate(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].createMany(queryBuilder.prismaCreateMany(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].update(queryBuilder.prismaUpdate(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].updateMany(queryBuilder.prismaUpdateMany(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].upsert(queryBuilder.prismaUpsert(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].delete(queryBuilder.prismaDelete(query.prismaArgs))

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
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].deleteMany(queryBuilder.prismaDeleteMany(query.prismaArgs))

    return results
}
