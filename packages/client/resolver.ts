import { PrismaClient, QueryParams } from './defs'

/**
 *  #### Query :: Find Unique
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function getQuery(prismaClient: PrismaClient, query: QueryParams) {
    if (query.context.model === null) return

    const results = await prismaClient[query.context.model].findUnique({
        where: query.prismaArgs.where,
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
    })

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

    console.log(
        JSON.stringify({
            ...(query.prismaArgs.where && { where: query.prismaArgs.where }),
            ...(query.prismaArgs.orderBy && { orderBy: query.prismaArgs.orderBy }),
            ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
            ...(typeof query.prismaArgs.skip !== 'undefined' && { skip: query.prismaArgs.skip }),
            ...(typeof query.prismaArgs.take !== 'undefined' && { take: query.prismaArgs.take }),
        }),
    )

    const results = await prismaClient[query.context.model].findMany({
        ...(query.prismaArgs.where && { where: query.prismaArgs.where }),
        ...(query.prismaArgs.orderBy && { orderBy: query.prismaArgs.orderBy }),
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
        ...(typeof query.prismaArgs.skip !== 'undefined' && { skip: query.prismaArgs.skip }),
        ...(typeof query.prismaArgs.take !== 'undefined' && { take: query.prismaArgs.take }),
    })

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

    const results = await prismaClient[query.context.model].count({
        ...(query.prismaArgs.where && { where: query.prismaArgs.where }),
        ...(query.prismaArgs.orderBy && { orderBy: query.prismaArgs.orderBy }),
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
        ...(typeof query.prismaArgs.skip !== 'undefined' && { skip: query.prismaArgs.skip }),
        ...(typeof query.prismaArgs.take !== 'undefined' && { take: query.prismaArgs.take }),
    })

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

    const results = await prismaClient[query.context.model].create({
        data: query.prismaArgs.data,
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
    })

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

    const results = await prismaClient[query.context.model].createMany({
        data: query.prismaArgs.data,
        ...(query.prismaArgs.skipDuplicates && { skipDuplicates: query.prismaArgs.skipDuplicates }),
    })

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

    const results = await prismaClient[query.context.model].update({
        data: query.prismaArgs.data,
        where: query.prismaArgs.where,
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
    })

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

    const results = await prismaClient[query.context.model].updateMany({
        data: query.prismaArgs.data,
        where: query.prismaArgs.where,
    })

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

    const results = await prismaClient[query.context.model].upsert({
        update: query.prismaArgs.data,
        create: query.prismaArgs.data,
        where: query.prismaArgs.where,
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
    })

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

    const results = await prismaClient[query.context.model].delete({
        where: query.prismaArgs.where,
        ...(query.prismaArgs.select && { select: query.prismaArgs.select }),
    })

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

    const results = await prismaClient[query.context.model].deleteMany({
        where: query.prismaArgs.where,
    })

    return results
}
