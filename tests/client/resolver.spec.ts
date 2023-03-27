import { describe, expect } from 'vitest'
import * as queries from '@client/resolver'
import type { Model, QueryParams } from '@client/defs'
import { Actions, ActionsAliases, Authorizations } from '@client/defs'
import useLambdaIdentity from '@appsync-server/utils/useLambdaIdentity'
import { testEach } from './_helpers'

process.env.PRISMA_APPSYNC_TESTING = 'true'

const TESTING = {
    PostModel: {
        prismaRef: 'post',
        singular: 'Post',
        plural: 'Posts',
    },
}

const identity = useLambdaIdentity(Authorizations.AMAZON_COGNITO_USER_POOLS, {
    sourceIp: 'xxx.xxx.xxx.x',
    username: 'johndoe',
    sub: 'xxxxxx',
    resolverContext: {},
})

describe('CLIENT #queries', () => {
    const query: QueryParams = {
        headers: {},
        args: {},
        context: {
            action: Actions.get,
            alias: ActionsAliases.access,
            model: TESTING.PostModel,
        },
        prismaArgs: {
            data: { title: 'Hello World' },
            select: { title: true },
            where: { id: 2 },
            orderBy: { title: 'DESC' },
            skip: 2,
            take: 1,
            skipDuplicates: true,
        },
        authorization: Authorizations.AMAZON_COGNITO_USER_POOLS,
        identity,
        operation: 'getPost',
        fields: ['title'],
        type: 'Query',
        paths: [],
    }

    const createPrismaClient: any = (model: Model, prismaQuery: string) => {
        return {
            [model!.prismaRef]: {
                [prismaQuery]: (queryObject: any) => {
                    return queryObject
                },
            },
        }
    }

    const tests = [
        {
            name: 'getQuery',
            prismaQuery: 'findUnique',
            expectedResult: {
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
            },
        },
        {
            name: 'listQuery',
            prismaQuery: 'findMany',
            expectedResult: {
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
                orderBy: query.prismaArgs.orderBy,
                skip: query.prismaArgs.skip,
                take: query.prismaArgs.take,
            },
        },
        {
            name: 'countQuery',
            prismaQuery: 'count',
            expectedResult: {
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
                orderBy: query.prismaArgs.orderBy,
                skip: query.prismaArgs.skip,
                take: query.prismaArgs.take,
            },
        },
        {
            name: 'createQuery',
            prismaQuery: 'create',
            expectedResult: {
                data: query.prismaArgs.data,
                select: query.prismaArgs.select,
            },
        },
        {
            name: 'createManyQuery',
            prismaQuery: 'createMany',
            expectedResult: {
                data: query.prismaArgs.data,
                skipDuplicates: query.prismaArgs.skipDuplicates,
            },
        },
        {
            name: 'updateQuery',
            prismaQuery: 'update',
            expectedResult: {
                data: query.prismaArgs.data,
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
            },
        },
        {
            name: 'updateManyQuery',
            prismaQuery: 'updateMany',
            expectedResult: {
                data: query.prismaArgs.data,
                where: query.prismaArgs.where,
            },
        },
        {
            name: 'upsertQuery',
            prismaQuery: 'upsert',
            expectedResult: {
                create: query.prismaArgs.create,
                update: query.prismaArgs.update,
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
            },
        },
        {
            name: 'deleteQuery',
            prismaQuery: 'delete',
            expectedResult: {
                where: query.prismaArgs.where,
                select: query.prismaArgs.select,
            },
        },
        {
            name: 'deleteManyQuery',
            prismaQuery: 'deleteMany',
            expectedResult: {
                where: query.prismaArgs.where,
            },
        },
    ]

    const cases = tests.map((test: any) => {
        return [test.name, test.prismaQuery, test.expectedResult]
    })

    testEach(cases)('expect "{0}" to call "{1}" Prisma Query', async (queryName, prismaQuery, expectedResult) => {
        const result = await queries[queryName](createPrismaClient(query.context.model, prismaQuery), query)
        expect(result).toEqual(expectedResult)
    })
})
