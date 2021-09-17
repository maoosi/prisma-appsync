import { PrismaClient, ResolverQuery } from './defs';
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function getQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function listQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#count
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function countQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function createQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function createManyQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function updateQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#updatemany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function updateManyQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function upsertQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function deleteQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
/**
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#deletemany
 * @param  {PrismaClient} prismaClient
 * @param  {ResolverQuery} query
 */
export declare function deleteManyQuery(prismaClient: PrismaClient, query: ResolverQuery): Promise<any>;
