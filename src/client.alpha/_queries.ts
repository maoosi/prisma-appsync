import { PrismaClient, ResolverQuery } from './defs'


// export async function customQuery(prismaClient:PrismaClient, query:ResolverQuery, callback:Function) {
//     const callbackProps:CustomResolverProps = {
//         args: query.args,
//         authIdentity: this.authIdentity
//     }

//     const results = await callback(callbackProps)

//     return results
// }


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function getQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].findUnique({
        where: query.args.where,
        ...(query.args.select && { select: query.args.select })
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function listQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].findMany({
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
 * @param  {ResolverQuery} query
 */
export async function countQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].count({
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
 * @param  {ResolverQuery} query
 */
export async function createQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].create({
        data: query.args.data,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function createManyQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].createMany({
        data: query.args.data,
        ...(query.args.skipDuplicates && { skipDuplicates: query.args.skipDuplicates })
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function updateQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].update({
        data: query.args.data,
        where: query.args.where,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#updatemany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function updateManyQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].updateMany({
        data: query.args.data,
        where: query.args.where
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function upsertQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].upsert({
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
 * @param  {ResolverQuery} query
 */
export async function deleteQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].delete({
        where: query.args.where,
        ...(query.args.select && { select: query.args.select }),
    })

    return results
}


/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#deletemany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export async function deleteManyQuery(prismaClient:PrismaClient, query:ResolverQuery) {
    const results = await prismaClient[query.model].deleteMany({
        where: query.args.where
    })

    return results
}
