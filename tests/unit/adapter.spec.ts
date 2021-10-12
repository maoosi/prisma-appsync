import {
    getAction,
    getOperation,
    getModel,
    getFields,
    getType,
    getPrismaArgs,
    getPaths,
    getAuthIdentity,
} from 'src/client/adapter'
import { Actions, Action, Models, ActionsAliases, Authorization, Authorizations } from 'src/client/defs'
import { mockLambdaEvent, mockIdentity } from '../integration/appsync'

function mockAppSyncEvent(identity: NonNullable<Authorization>) {
    return mockLambdaEvent({
        request: {},
        graphQLParams: {
            query: String(),
            variables: {},
            operationName: String(),
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
        const cases = Object.keys(Actions).map((action: Action) => {
            return [`${action}People`, `${action}People`]
        })
        test.each(cases)('when fieldName is "%s", expect operation to equal "%s"', (fieldName, expected) => {
            const result = getOperation({ fieldName })
            expect(result).toEqual(expected)
        })
    })

    describe('.getAction?', () => {
        const cases = Object.keys(Actions).map((action: Action) => {
            return [`${action}People`, action]
        })
        test.each(cases)('when operation is "%s", expect action to equal "%s"', (operation, expected) => {
            const result = getAction({ operation })
            expect(result).toEqual(expected)
        })
    })

    describe('.getModel?', () => {
        const cases = Object.keys(Actions).map((action: Action) => {
            return [action, 'People']
        })
        test.each(cases)('when operation is "%sPeople", expect model to equal "%s"', (action: Action, expected) => {
            const result = getModel({ operation: `${action}People`, action: action })
            expect(result).toEqual(expected)
        })
    })

    // TODO: Write more tests for `getFields`
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
                _arguments: {
                    info: {
                        selectionSetList: ['title', 'createdAt', 'status'],
                    },
                },
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
                _arguments: {
                    info: {
                        selectionSetList: [
                            'title',
                            'createdAt',
                            'comments',
                            'comments/post',
                            'comments/author',
                            'comments/author/email',
                        ],
                    },
                },
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
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                where: { title: { startsWith: 'Hello' } },
            })
        })
        test('expect "data" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.create,
                _arguments: {
                    data: { title: 'Hello', content: 'World' },
                },
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
                data: { title: 'Hello', content: 'World' },
            })
        })
        test('expect "orderBy" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: {
                    orderBy: [{ title: 'ASC' }, { postedAt: 'DESC' }],
                },
                defaultPagination: false,
            })
            expect(result).toStrictEqual({
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
                    defaultPagination: false,
                }),
            ).toThrow(Error)
        })
        test('expect "skip" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { skip: '5' },
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ skip: 5 })
        })
        test('expect "take" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { take: '3' },
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ take: 3 })
        })
        test('expect "skipDuplicates" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { skipDuplicates: true },
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ skipDuplicates: true })
        })
        test('expect default pagination to do nothing when "take" is specified', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: { take: '3' },
            })
            expect(result).toStrictEqual({ skip: 0, take: 3 })
        })
        test('expect default pagination to apply default take value', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: {},
            })
            expect(result).toStrictEqual({ skip: 0, take: 50 })
        })
    })

    // TODO: Write more tests for `getPaths` (cover more actions)
    describe('.getPaths?', () => {
        test('expect nested get to return matching paths', () => {
            const result = getPaths({
                action: Actions.get,
                subject: {
                    actionAlias: ActionsAliases.access,
                    model: Models.Post,
                },
                args: getPrismaArgs({
                    action: Actions.get,
                    _arguments: {
                        info: {
                            selectionSetList: [
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
                        },
                    },
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
                action: Actions.update,
                subject: {
                    actionAlias: ActionsAliases.modify,
                    model: Models.Post,
                },
                args: getPrismaArgs({
                    action: Actions.update,
                    _arguments: {
                        data: {
                            title: 'New title',
                            author: {
                                connect: {
                                    username: 'other user',
                                },
                            },
                        },
                        info: {
                            selectionSetList: [
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
                action: Actions.createMany,
                subject: {
                    actionAlias: ActionsAliases.batchCreate,
                    model: Models.Post,
                },
                args: getPrismaArgs({
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
                        info: {
                            selectionSetList: [
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
                        },
                    },
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual([
                '/createmany/post/title',
                '/createmany/post/author/username',
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
