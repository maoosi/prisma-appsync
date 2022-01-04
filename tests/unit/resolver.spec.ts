import * as queries from '../../packages/client/resolver'
import { QueryParams, Authorizations, Actions, ActionsAliases } from '../../packages/client/defs'
import { mockIdentity } from '../integration/appsync'
import { Prisma } from '@prisma/client'

const Models = Prisma.ModelName

process.env.PRISMA_APPSYNC_TESTING = 'true'

const identity = mockIdentity(Authorizations.AMAZON_COGNITO_USER_POOLS, {
    sourceIp: 'xxx.xxx.xxx.x',
    username: 'johndoe',
    sub: 'xxxxxx',
    resolverContext: {},
})

describe('CLIENT #queries', () => {
    const query: QueryParams = {
        args: {},
        context: {
            action: Actions.get,
            alias: ActionsAliases.access,
            model: Models.Post,
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

    const createPrismaClient: any = (model: string, prismaQuery: string) => {
        return {
            [model]: {
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
                update: query.prismaArgs.data,
                create: query.prismaArgs.data,
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

    test.each(cases)('expect "%s" to call "%s" Prisma Query', async (name, prismaQuery, expectedResult) => {
        const result = await queries[name](createPrismaClient(query.context.model, prismaQuery), query)
        expect(result).toEqual(expectedResult)
    })
})
