import { describe, expect, test } from 'vitest'
import {
    addNullables,
    getAction,
    getAuthIdentity,
    getContext,
    getFields,
    getModel,
    getOperation,
    getPaths,
    getPrismaArgs,
    getType,
} from '@client/adapter'
import type { Action, Authorization, Options } from '@client/defs'
import { Actions, ActionsAliases, Authorizations } from '@client/defs'
import { Prisma } from '@prisma/client'
import useLambdaIdentity from '@appsync-server/utils/useLambdaIdentity'
import useLambdaEvents from '@appsync-server/utils/useLambdaEvents'
import { plural } from 'pluralize'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import { testEach } from './_helpers'

const pascalCase = flow(camelCase, upperFirst)
const models: {
    [key: string]: {
        prismaRef: string
        singular: string
        plural: string
    }
} = {
    People: {
        prismaRef: 'people',
        singular: 'People',
        plural: 'Peoples',
    },
}

Prisma.dmmf.datamodel.models.forEach((m) => {
    models[plural(pascalCase(m.name))] = {
        prismaRef: m.name,
        singular: pascalCase(m.name),
        plural: pascalCase(plural(m.name)),
    }
    models[pascalCase(m.name)] = {
        prismaRef: m.name,
        singular: pascalCase(m.name),
        plural: pascalCase(plural(m.name)),
    }
})

process.env.PRISMA_APPSYNC_TESTING = 'true'
process.env.PRISMA_APPSYNC_INJECTED_CONFIG = JSON.stringify({
    modelsMapping: models,
})

const TESTING: {
    models: typeof models
    options: Options
} = {
    models,
    options: {
        connectionString: 'xxx',
        sanitize: true,
        logLevel: 'INFO' as const,
        defaultPagination: false,
        maxDepth: 3,
        maxReqPerUserMinute: 200,
        fieldsMapping: {},
        modelsMapping: models,
    },
}

function mockAppSyncEvent(identity: NonNullable<Authorization>) {
    return useLambdaEvents({
        request: {},
        graphQLParams: {
            query: 'query getPost { getPost { title } }',
            variables: {},
            operationName: 'getPost',
            raw: {},
        },
        identity: useLambdaIdentity(identity, {
            sourceIp: 'xxx.xxx.xxx.xxx',
            username: 'johndoe',
            sub: 'xxxxxx',
            resolverContext: {},
        }),
    })?.[0] || {}
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
        testEach(cases)('when fieldName is "{0}", expect operation to equal "{1}"', (fieldName, expected) => {
            const result = getOperation({ fieldName })
            expect(result).toEqual(expected)
        })
    })

    describe('.getAction?', () => {
        const cases = Object.values(Actions).map((action: Action) => {
            return [`${action}People`, action]
        })
        testEach(cases)('when operation is "{0}", expect action to equal "{1}"', (operation: any, expected) => {
            const result = getAction({ operation })
            expect(result).toEqual(expected)
        })
    })

    describe('.getModel?', () => {
        const cases = Object.values(Actions).map((action: Action) => {
            return [action, models.People]
        })
        testEach(cases)('when operation is "{0}People", expect model to equal "{1}"', (action: Action, expected) => {
            const result = getModel({ operation: `${action}People`, action, options: TESTING.options })
            expect(result).toEqual(expected)
        })
    })

    describe('.getContext?', () => {
        test('expect to extract context from custom resolver', () => {
            const context = getContext({
                customResolvers: {
                    notify: async () => {
                        return { message: 'Hello world' }
                    },
                },
                options: TESTING.options,
                operation: 'notify',
            })
            expect(context).toEqual({
                action: 'notify',
                alias: 'custom',
                model: null,
            })
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
            expect(result).toStrictEqual({ skip: 5 })
        })
        test('expect "take" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { take: '3' },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ take: 3 })
        })
        test('expect "skipDuplicates" to be converted to prisma syntax', () => {
            const result = getPrismaArgs({
                action: Actions.list,
                _arguments: { skipDuplicates: true },
                _selectionSetList: [],
                defaultPagination: false,
            })
            expect(result).toStrictEqual({ skipDuplicates: true })
        })
        test('expect default pagination to do nothing when "take" is specified', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: { take: '3' },
                _selectionSetList: [],
            })
            expect(result).toStrictEqual({ skip: 0, take: 3 })
        })
        test('expect default pagination to apply default take value', () => {
            const result = getPrismaArgs({
                defaultPagination: 50,
                action: Actions.list,
                _arguments: {},
                _selectionSetList: [],
            })
            expect(result).toStrictEqual({ skip: 0, take: 50 })
        })
    })

    describe('.getPaths?', () => {
        test('expect nested get to return matching paths', () => {
            const result = getPaths({
                operation: 'getPost',
                context: {
                    action: Actions.get,
                    alias: ActionsAliases.access,
                    model: TESTING.models.Post,
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
                'getPost',
                'getPost/title',
                'getPost/comment',
                'getPost/comment/content',
                'getPost/comment/author',
                'getPost/comment/author/email',
                'getPost/comment/author/username',
                'getPost/comment/author/badges',
                'getPost/comment/author/badges/label',
                'getPost/comment/author/badges/owners',
                'getPost/comment/author/badges/owners/email',
            ])
        })

        test('expect nested update to return matching paths', () => {
            const args = {
                data: {
                    title: 'New title',
                    author: {
                        connect: {
                            username: 'other user',
                        },
                    },
                },
            }
            const result = getPaths({
                operation: 'updatePost',
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.models.Post,
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
                    _arguments: args,
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual([
                'updatePost',
                'updatePost/title',
                'updatePost/author',
                'updatePost/author/connect',
                'updatePost/author/connect/username',
                'getPost',
                'getPost/title',
                'getPost/comment',
                'getPost/comment/content',
                'getPost/comment/author',
                'getPost/comment/author/email',
                'getPost/comment/author/username',
                'getPost/comment/author/badges',
                'getPost/comment/author/badges/label',
                'getPost/comment/author/badges/owners',
                'getPost/comment/author/badges/owners/email',
            ])
        })

        test('expect nested createMany to return matching paths', () => {
            const args = {
                data: [
                    {
                        title: 'First title of many',
                        author: {
                            connect: {
                                username: 'johndoe',
                            },
                        },
                    },
                ],
            }
            const result = getPaths({
                operation: 'createManyPosts',
                context: {
                    action: Actions.createMany,
                    alias: ActionsAliases.batchCreate,
                    model: TESTING.models.Post,
                },
                prismaArgs: getPrismaArgs({
                    action: Actions.createMany,
                    _arguments: args,
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
                'createManyPosts',
                'createManyPosts/title',
                'createManyPosts/author',
                'createManyPosts/author/connect',
                'createManyPosts/author/connect/username',
                'listPosts',
                'listPosts/title',
                'listPosts/comment',
                'listPosts/comment/content',
                'listPosts/comment/author',
                'listPosts/comment/author/email',
                'listPosts/comment/author/username',
                'listPosts/comment/author/badges',
                'listPosts/comment/author/badges/label',
                'listPosts/comment/author/badges/owners',
                'listPosts/comment/author/badges/owners/email',
            ])
        })

        test('expect custom resolver notify to return matching paths', () => {
            const resolver = 'notify'
            const result = getPaths({
                operation: resolver,
                context: {
                    action: resolver,
                    alias: 'custom',
                    model: null,
                },
                prismaArgs: getPrismaArgs({
                    action: resolver,
                    _arguments: {
                        message: 'Hello World',
                    },
                    _selectionSetList: ['__typename', 'message'],
                    defaultPagination: false,
                }),
            })
            expect(result).toEqual(['notify', 'notify/message'])
        })
    })

    describe('.addNullables?', () => {
        test('expect addNullables to convert is, isNot and isNull inputs', async () => {
            const result = await addNullables({
                post: { is: 'NULL' },
                user: { isNot: 'NULL' },
                comment: { isNull: true },
                blog: { isNull: false },
            })
            expect(result).toEqual({
                post: { is: null },
                user: { isNot: null },
                comment: { equals: null },
                blog: { not: null },
            })
        })
    })
})
