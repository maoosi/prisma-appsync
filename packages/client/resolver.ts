import { PrismaClient, QueryParams, PrismaArgs, QueryBuilder } from './defs'

/**
 *  #### Query Builder
 */
export const queryBuilder: QueryBuilder = {
    prismaGet: (prismaArgs: PrismaArgs) => ({
        where: prismaArgs.where,
        ...(prismaArgs.select && { select: prismaArgs.select }),
    }),
    prismaList: (prismaArgs: PrismaArgs) => ({
        ...(prismaArgs.where && { where: prismaArgs.where }),
        ...(prismaArgs.orderBy && { orderBy: prismaArgs.orderBy }),
        ...(prismaArgs.select && { select: prismaArgs.select }),
        ...(typeof prismaArgs.skip !== 'undefined' && { skip: prismaArgs.skip }),
        ...(typeof prismaArgs.take !== 'undefined' && { take: prismaArgs.take }),
    }),
    prismaCount: (prismaArgs: PrismaArgs) => ({
        ...(prismaArgs.where && { where: prismaArgs.where }),
        ...(prismaArgs.orderBy && { orderBy: prismaArgs.orderBy }),
        ...(prismaArgs.select && { select: prismaArgs.select }),
        ...(typeof prismaArgs.skip !== 'undefined' && { skip: prismaArgs.skip }),
        ...(typeof prismaArgs.take !== 'undefined' && { take: prismaArgs.take }),
    }),
    prismaCreate: (prismaArgs: PrismaArgs) => ({
        data: prismaArgs.data,
        ...(prismaArgs.select && { select: prismaArgs.select }),
    }),
    prismaCreateMany: (prismaArgs: PrismaArgs) => ({
        data: prismaArgs.data,
        ...(prismaArgs.skipDuplicates && { skipDuplicates: prismaArgs.skipDuplicates }),
    }),
    prismaUpdate: (prismaArgs: PrismaArgs) => ({
        data: prismaArgs.data,
        where: prismaArgs.where,
        ...(prismaArgs.select && { select: prismaArgs.select }),
    }),
    prismaUpdateMany: (prismaArgs: PrismaArgs) => ({
        data: prismaArgs.data,
        where: prismaArgs.where,
    }),
    prismaUpsert: (prismaArgs: PrismaArgs) => ({
        update: prismaArgs.data,
        create: prismaArgs.data,
        where: prismaArgs.where,
        ...(prismaArgs.select && { select: prismaArgs.select }),
    }),
    prismaDelete: (prismaArgs: PrismaArgs) => ({
        where: prismaArgs.where,
        ...(prismaArgs.select && { select: prismaArgs.select }),
    }),
    prismaDeleteMany: (prismaArgs: PrismaArgs) => ({
        where: prismaArgs.where,
    }),
    prismaWhere: (prismaArgs: PrismaArgs, filters: any | any[]) => {
        if (!Array.isArray(filters)) filters = [filters]

        filters.forEach((filter: any) => {
            if (prismaArgs?.where?.AND) prismaArgs.where.AND.push(filter)
            else if (prismaArgs?.where) prismaArgs.where = { AND: [prismaArgs.where, filter] }
            else prismaArgs.where = filter
        })

        return prismaArgs
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
