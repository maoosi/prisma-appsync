import * as queries from '../../src/client/resolver'
import { QueryParams } from '../../src/client/defs'

describe('CLIENT #queries', () => {
    const query: QueryParams = {
        subject: {
            model: 'Post',
            actionAlias: 'access',
        },
        args: {
            data: { title: 'Hello World' },
            select: { title: true },
            where: { id: 2 },
            orderBy: { title: 'DESC' },
            skip: 2,
            take: 1,
            skipDuplicates: true,
        },
        operation: null,
        action: null,
        fields: null,
        type: null,
        authIdentity: null,
        paths: null,
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
                where: query.args.where,
                select: query.args.select,
            },
        },
        {
            name: 'listQuery',
            prismaQuery: 'findMany',
            expectedResult: {
                where: query.args.where,
                select: query.args.select,
                orderBy: query.args.orderBy,
                skip: query.args.skip,
                take: query.args.take,
            },
        },
        {
            name: 'countQuery',
            prismaQuery: 'count',
            expectedResult: {
                where: query.args.where,
                select: query.args.select,
                orderBy: query.args.orderBy,
                skip: query.args.skip,
                take: query.args.take,
            },
        },
        {
            name: 'createQuery',
            prismaQuery: 'create',
            expectedResult: {
                data: query.args.data,
                select: query.args.select,
            },
        },
        {
            name: 'createManyQuery',
            prismaQuery: 'createMany',
            expectedResult: {
                data: query.args.data,
                skipDuplicates: query.args.skipDuplicates,
            },
        },
        {
            name: 'updateQuery',
            prismaQuery: 'update',
            expectedResult: {
                data: query.args.data,
                where: query.args.where,
                select: query.args.select,
            },
        },
        {
            name: 'updateManyQuery',
            prismaQuery: 'updateMany',
            expectedResult: {
                data: query.args.data,
                where: query.args.where,
            },
        },
        {
            name: 'upsertQuery',
            prismaQuery: 'upsert',
            expectedResult: {
                update: query.args.data,
                create: query.args.data,
                where: query.args.where,
                select: query.args.select,
            },
        },
        {
            name: 'deleteQuery',
            prismaQuery: 'delete',
            expectedResult: {
                where: query.args.where,
                select: query.args.select,
            },
        },
        {
            name: 'deleteManyQuery',
            prismaQuery: 'deleteMany',
            expectedResult: {
                where: query.args.where,
            },
        },
    ]

    const cases = tests.map((test: any) => {
        return [test.name, test.prismaQuery, test.expectedResult]
    })

    test.each(cases)('expect "%s" to call "%s" Prisma Query', async (name, prismaQuery, expectedResult) => {
        const model = typeof query.subject !== 'string' ? query.subject.model : String()
        const result = await queries[name](createPrismaClient(model, prismaQuery), query)
        expect(result).toEqual(expectedResult)
    })
})
