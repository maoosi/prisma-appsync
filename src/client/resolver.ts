import { PrismaClient, QueryParams } from './defs'


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function getQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].findUnique({
        where: query.args.where,
        ...(query.args.select && { select: query.args.select })
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function listQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].findMany({
        ...(query.args.where && { where: query.args.where }),
        ...(query.args.orderBy && { orderBy: query.args.orderBy }),
        ...(query.args.select && { select: query.args.select }),
        ...(typeof query.args.skip !== 'undefined' && { skip: query.args.skip }),
        ...(typeof query.args.take !== 'undefined' && { take: query.args.take }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#count
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function countQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].count({
        ...(query.args.where && { where: query.args.where }),
        ...(query.args.orderBy && { orderBy: query.args.orderBy }),
        ...(query.args.select && { select: query.args.select }),
        ...(typeof query.args.skip !== 'undefined' && { skip: query.args.skip }),
        ...(typeof query.args.take !== 'undefined' && { take: query.args.take }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function createQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].create({
        data: query.args.data,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function createManyQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].createMany({
        data: query.args.data,
        ...(query.args.skipDuplicates && { skipDuplicates: query.args.skipDuplicates })
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function updateQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].update({
        data: query.args.data,
        where: query.args.where,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#updatemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function updateManyQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].updateMany({
        data: query.args.data,
        where: query.args.where
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function upsertQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].upsert({
        update: query.args.data,
        create: query.args.data,
        where: query.args.where,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function deleteQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].delete({
        where: query.args.where,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#deletemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export async function deleteManyQuery(prismaClient:PrismaClient, query:QueryParams) {
    if (query.context.model === null) return;

    const results = await prismaClient[query.context.model].deleteMany({
        where: query.args.where
    })

    return results
}
