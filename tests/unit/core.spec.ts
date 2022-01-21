import { describe, expect, test } from 'vitest'
import { PrismaAppSync } from '../../packages/client'
import { mockLambdaEvent, mockIdentity } from '../integration/appsync'
import { Authorizations, Actions, ActionsAliases } from '../../packages/client/defs'
import { Prisma } from '@prisma/client'

process.env.PRISMA_APPSYNC_TESTING = 'true'
process.env.PRISMA_APPSYNC_GENERATED_CONFIG = JSON.stringify({
    prismaClientModels: { Post: 'post', Posts: 'post' },
})

const Models = Prisma.ModelName

function mockAppSyncEvent(operationName: string, query: string) {
    return mockLambdaEvent({
        request: {},
        identity: mockIdentity(Authorizations.API_KEY),
        graphQLParams: {
            operationName: operationName,
            query: query,
        },
    })
}

describe('CLIENT #core', () => {
    describe('.connectionString?', () => {
        test('expect Connection String to be configurable via Class options', () => {
            const connectionString = 'postgres://' + (+new Date()).toString(36).slice(-5)
            new PrismaAppSync({ connectionString })
            expect(process.env.DATABASE_URL).toEqual(connectionString)
        })
        test('expect Connection String to be configurable via DATABASE_URL env var', () => {
            process.env.DATABASE_URL = 'postgres://' + (+new Date()).toString(36).slice(-5)
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.connectionString).toEqual(process.env.DATABASE_URL)
        })
    })

    describe('.sanitize?', () => {
        test('expect Sanitize to be TRUE by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.sanitize).toEqual(true)
        })
        test('expect Sanitize to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ sanitize: false })
            expect(prismaAppSync.options.sanitize).toEqual(false)
        })
        test('expect Sanitizer to sanitize inputs', async () => {
            const prismaAppSync = new PrismaAppSync()
            const event = mockAppSyncEvent(
                'createPost',
                `query createPost {
                    createPost(
                        data: {
                            title: "<IMG SRC=\\"javascript:alert('XSS');\\">"
                        }
                    ) {
                        title
                    }
                }`,
            )
            const result = await prismaAppSync.resolve({ event })
            const maliciousXss = result?.__prismaAppsync?.QueryParams?.prismaArgs?.data?.title
            expect(maliciousXss).toEqual('&lt;img src&gt;')
        })
        test('expect outputs to be de-sanitize automatically', async () => {
            const prismaAppSync = new PrismaAppSync()
            const event = mockAppSyncEvent(
                'createPost',
                `query createPost {
                    createPost(
                        data: {
                            title: "<IMG SRC=\\"javascript:alert('XSS');\\">"
                        }
                    ) {
                        title
                    }
                }`,
            )
            const result = await prismaAppSync.resolve({ event })
            expect(result?.title).toEqual('<img src>')
        })
    })

    describe('.debug?', () => {
        test('expect Debug Logs to be TRUE by default', () => {
            new PrismaAppSync()
            expect(process.env.PRISMA_APPSYNC_DEBUG).toEqual(String(true))
        })
        test('expect Debug Logs to be configurable via Class options', () => {
            new PrismaAppSync({ debug: false })
            expect(process.env.PRISMA_APPSYNC_DEBUG).toEqual(String(false))
        })
    })

    describe('.defaultPagination?', () => {
        test('expect Pagination to equal 50 by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.defaultPagination).toEqual(50)
        })
        test('expect Pagination to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ defaultPagination: 13 })
            expect(prismaAppSync.options.defaultPagination).toEqual(13)
        })
    })

    describe('.maxDepth?', () => {
        test('expect Max Query Depth to equal 3 by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.maxDepth).toEqual(3)
        })
        test('expect Max Query Depth to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ maxDepth: 5 })
            expect(prismaAppSync.options.maxDepth).toEqual(5)
        })
    })

    describe('.resolve?', () => {
        test('expect Resolve to return matching Query Params', async () => {
            const prismaAppSync = new PrismaAppSync()
            const result = await prismaAppSync.resolve({
                event: mockAppSyncEvent(
                    'getPost',
                    `query getPost {
                        getPost(where: {
                            title: { not: { equals: "Foo" } }
                        }) { 
                            title
                            author {
                                username
                            }
                        }
                    }`,
                ),
            })
            expect(result?.__prismaAppsync?.QueryParams).toEqual({
                args: {
                    where: {
                        title: { not: { equals: 'Foo' } },
                    },
                },
                authorization: Authorizations.API_KEY,
                context: {
                    action: Actions.get,
                    alias: ActionsAliases.access,
                    model: Models.Post.toLowerCase(),
                },
                fields: ['title', 'author/username'],
                identity: {},
                operation: 'getPost',
                paths: ['/get/post/title', '/get/post/author/username'],
                prismaArgs: {
                    where: {
                        title: { not: { equals: 'Foo' } },
                    },
                    select: {
                        title: true,
                        author: {
                            select: { username: true },
                        },
                    },
                },
                type: 'Query',
            })
        })
    })
})
