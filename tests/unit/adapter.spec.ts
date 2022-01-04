import {
    getAction,
    getOperation,
    getModel,
    getFields,
    getType,
    getPrismaArgs,
    getPaths,
    getAuthIdentity,
} from '../../packages/client/adapter'
import { Actions, Action, ActionsAliases, Authorization, Authorizations } from '../../packages/client/defs'
import { Prisma } from '@prisma/client'
import { mockLambdaEvent, mockIdentity } from '../integration/appsync'

process.env.PRISMA_APPSYNC_TESTING = 'true'

const Models = Prisma.ModelName

function mockAppSyncEvent(identity: NonNullable<Authorization>) {
    return mockLambdaEvent({
        request: {},
        graphQLParams: {
            query: `query getPost { getPost { title } }`,
            variables: {},
            operationName: 'getPost',
            raw: {},
        },
        identity: mockIdentity(identity, {
            sourceIp: 'xxx.xxx.xxx.xxx',
            username: 'johndoe',
            sub: 'xxxxxx',
            resolverContext: {},
        }),
    })
}

describe('CLIENT #adapter', () => {
    describe('.getAuthIdentity?', () => {
        test('expect to detect API_KEY authorization', () => {
            const result = getAuthIdentity({
                appsyncEvent: mockAppSyncEvent(Authorizations.API_KEY),
            })
            expect(result.authorization).toEqual(Authorizations.API_KEY)
        })

        test('expect to detect AWS_LAMBDA authorization', () => {
            const result = getAuthIdentity({
                appsyncEvent: mockAppSyncEvent(Authorizations.AWS_LAMBDA),
            })
            expect(result.authorization).toEqual(Authorizations.AWS_LAMBDA)
        })

        test('expect to detect AWS_IAM authorization', () => {
            const result = getAuthIdentity({
                appsyncEvent: mockAppSyncEvent(Authorizations.AWS_IAM),
            })
            expect(result.authorization).toEqual(Authorizations.AWS_IAM)
        })

        test('expect to detect AMAZON_COGNITO_USER_POOLS authorization', () => {
            const result = getAuthIdentity({
                appsyncEvent: mockAppSyncEvent(Authorizations.AMAZON_COGNITO_USER_POOLS),
            })
            expect(result.authorization).toEqual(Authorizations.AMAZON_COGNITO_USER_POOLS)
        })

        test('expect to detect OPENID_CONNECT authorization', () => {
            const result = getAuthIdentity({
                appsyncEvent: mockAppSyncEvent(Authorizations.OPENID_CONNECT),
            })
            expect(result.authorization).toEqual(Authorizations.OPENID_CONNECT)
        })

        test('expect to throw when no matching authorization', () => {
            expect(() =>
                getAuthIdentity({
                    appsyncEvent: { identity: 'string' } as any,
                }),
            ).toThrow(Error)
        })
    })

    describe('.getOperation?', () => {
        const cases = Object.values(Actions).map((action: Action) => {
            return [`${action}People`, `${action}People`]
        })
        test.each(cases)('when fieldName is "%s", expect operation to equal "%s"', (fieldName, expected) => {
            const result = getOperation({ fieldName })
            expect(result).toEqual(expected)
        })
    })

    describe('.getAction?', () => {
        const cases = Object.values(Actions).map((action: Action) => {
            return [`${action}People`, action]
        })
        test.each(cases)('when operation is "%s", expect action to equal "%s"', (operation: any, expected) => {
            const result = getAction({ operation })
            expect(result).toEqual(expected)
        })
    })

    describe('.getModel?', () => {
        const cases = Object.values(Actions).map((action: Action) => {
            return [action, 'People']
        })
        test.each(cases)('when operation is "%sPeople", expect model to equal "%s"', (action: Action, expected) => {
            const result = getModel({ operation: `${action}People`, action: action })
            expect(result).toEqual(expected)
        })
    })

    describe('.getFields?', () => {
        test('expect to extract all first level fields', () => {
            const result = getFields({
                _selectionSetList: [
                    '__typename',
                    'title',
                    'description',
                    'author',
                    'author/username',
                    'author/email',
                    'author/comments',
                    'author/comments/text',
                    'author/comments/likes',
                    'author/comments/likes/user',
                    'author/comments/likes/user/username',
                ],
            })
            expect(result).toEqual(['title', 'description', 'author'])
        })
    })

    describe('.getType?', () => {
        test('expect type to equal "Query"', () => {
            const result = getType({ _parentTypeName: 'Query' })
            expect(result).toEqual('Query')
        })
        test('expect type to equal "Mutation"', () => {
            const result = getType({ _parentTypeName: 'Mutation' })
            expect(result).toEqual('Mutation')
        })
        test('expect type to equal "Subscription"', () => {
            const result = getType({ _parentTypeName: 'Subscription' })
            expect(result).toEqual('Subscription')
        })
        test('when wrong _parentTypeName field, expect to throw Error()', () => {
            expect(() => getType({ _parentTypeName: 'User' })).toThrow(Error)
        })
    })

    describe('.getPrismaArgs?', () => {
        test('expect selectionSetList to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.get,
                _arguments: {},
                _selectionSetList: ['title', 'createdAt', 'status'],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                select: {
                    title: true,
                    createdAt: true,
                    status: true,
                },
            })
        })
        test('expect nested selectionSetList to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: {},
                _selectionSetList: [
                    'title',
                    'createdAt',
                    'comments',
                    'comments/post',
                    'comments/author',
                    'comments/author/email',
                ],
                defaultPagination: false,
            })
            expect(result).toEqual({
                select: {
                    title: true,
                    createdAt: true,
                    comments: {
                        select: {
                            post: true,
                            author: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                },
            })
        })
        test('expect "where" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.count,
                _arguments: {
                    where: { title: { startsWith: 'Hello' } },
                },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                select: {},
                where: { title: { startsWith: 'Hello' } },
            })
        })
        test('expect "data" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.create,
                _arguments: {
                    data: { title: 'Hello', content: 'World' },
                },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                select: {},
                data: { title: 'Hello', content: 'World' },
            })
        })
        test('expect "orderBy" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: {
                    orderBy: [{ title: 'ASC' }, { postedAt: 'DESC' }],
                },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                select: {},
                orderBy: [{ title: 'asc' }, { postedAt: 'desc' }],
            })
        })
        test('expect "orderBy" to throw an error when using wrong format', () => {
            expect(() =>
                getPrismaArgs({
                    action: Actions.list,
                    _arguments: {
                        orderBy: [{ title: 'ASC', content: 'DESC' }, { postedAt: 'DESC' }],
                    },
                    _selectionSetList: [],
                    defaultPagination: false,
                }),
            ).toThrow(Error)
        })
        test('expect "skip" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { skip: '5' },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ select: {}, skip: 5 })
        })
        test('expect "take" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { take: '3' },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ select: {}, take: 3 })
        })
        test('expect "skipDuplicates" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { skipDuplicates: true },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ select: {}, skipDuplicates: true })
        })
        test('expect default pagination to do nothing when "take" is specified', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: { take: '3' },
                _selectionSetList: [],
            })
            expect(result).toStrictEqual({ select: {}, skip: 0, take: 3 })
        })
        test('expect default pagination to apply default take value', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: {},
                _selectionSetList: [],
            })
            expect(result).toStrictEqual({ select: {}, skip: 0, take: 50 })
        })
    })

    describe('.getPaths?', () => {
        test('expect nested get to return matching paths', () => {
            const result = getPaths({
                context: {
                    action: Actions.get,
                    alias: ActionsAliases.access,
                    model: Models.Post,
                },
                prismaArgs: getPrismaArgs({
                    action: Actions.get,
                    _selectionSetList: [
                        '__typename',
                        'title',
                        'comment',
                        'comment/content',
                        'comment/author',
                        'comment/author/email',
                        'comment/author/username',
                        'comment/author/badges',
                        'comment/author/badges/label',
                        'comment/author/badges/owners',
                        'comment/author/badges/owners/email',
                    ],
                    _arguments: {},
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual([
                '/get/post/title',
                '/get/post/comment/content',
                '/get/post/comment/author/email',
                '/get/post/comment/author/username',
                '/get/post/comment/author/badges/label',
                '/get/post/comment/author/badges/owners/email',
            ])
        })

        test('expect nested update to return matching paths', () => {
            const result = getPaths({
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                prismaArgs: getPrismaArgs({
                    action: Actions.update,
                    _selectionSetList: [
                        '__typename',
                        'title',
                        'comment',
                        'comment/content',
                        'comment/author',
                        'comment/author/email',
                        'comment/author/username',
                        'comment/author/badges',
                        'comment/author/badges/label',
                        'comment/author/badges/owners',
                        'comment/author/badges/owners/email',
                    ],
                    _arguments: {
                        data: {
                            title: 'New title',
                            author: {
                                connect: {
                                    username: 'other user',
                                },
                            },
                        },
                    },
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual([
                '/update/post/title',
                '/update/post/author/username',
                '/get/post/title',
                '/get/post/comment/content',
                '/get/post/comment/author/email',
                '/get/post/comment/author/username',
                '/get/post/comment/author/badges/label',
                '/get/post/comment/author/badges/owners/email',
            ])
        })

        test('expect nested createMany to return matching paths', () => {
            const result = getPaths({
                context: {
                    action: Actions.createMany,
                    alias: ActionsAliases.batchCreate,
                    model: Models.Post,
                },
                prismaArgs: getPrismaArgs({
                    action: Actions.createMany,
                    _arguments: {
                        data: [
                            {
                                title: 'New title',
                                author: {
                                    connect: {
                                        username: 'johndoe',
                                    },
                                },
                            },
                        ],
                    },
                    _selectionSetList: [
                        '__typename',
                        'title',
                        'comment',
                        'comment/content',
                        'comment/author',
                        'comment/author/email',
                        'comment/author/username',
                        'comment/author/badges',
                        'comment/author/badges/label',
                        'comment/author/badges/owners',
                        'comment/author/badges/owners/email',
                    ],
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual([
                '/createMany/post/title',
                '/createMany/post/author/username',
                '/list/post/title',
                '/list/post/comment/content',
                '/list/post/comment/author/email',
                '/list/post/comment/author/username',
                '/list/post/comment/author/badges/label',
                '/list/post/comment/author/badges/owners/email',
            ])
        })
    })
})
