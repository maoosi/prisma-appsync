import type { PrismaArgs, PrismaClient, PrismaOperator, QueryBuilder, QueryParams } from './defs';
/**
 *  #### Query Builder
 */
export declare function prismaQueryJoin<T>(queries: PrismaArgs[], operators: PrismaOperator[]): T;
export declare const queryBuilder: QueryBuilder;
/**
 *  #### Query :: Find Unique
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function getQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Query :: Find Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function listQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Query :: Count
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#count
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function countQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Create
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#create
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function createQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Create Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#createmany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function createManyQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Update
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#update
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function updateQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Update Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#updatemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function updateManyQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Upsert
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function upsertQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Delete
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#delete
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function deleteQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
/**
 * #### Mutation :: Delete Many
 *
 * https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#deletemany
 * @param  {PrismaClient} prismaClient
 * @param  {QueryParams} query
 */
export declare function deleteManyQuery(prismaClient: PrismaClient, query: QueryParams): Promise<any>;
