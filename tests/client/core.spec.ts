/* eslint-disable no-new */
import { describe, expect, test } from 'vitest'
import { PrismaAppSync } from '@client'
import useLambdaIdentity from '@appsync-server/utils/useLambdaIdentity'
import useLambdaEvents from '@appsync-server/utils/useLambdaEvents'
import { Actions, ActionsAliases, Authorizations } from '@client/defs'

process.env.PRISMA_APPSYNC_TESTING = 'true'
process.env.PRISMA_APPSYNC_INJECTED_CONFIG = JSON.stringify({
    modelsMapping: {
        Posts: {
            prismaRef: 'post',
            singular: 'Post',
            plural: 'Posts',
        },
        Post: {
            prismaRef: 'post',
            singular: 'Post',
            plural: 'Posts',
        },
    },
})

const TESTING = {
    PostModel: {
        prismaRef: 'post',
        singular: 'Post',
        plural: 'Posts',
    },
}

function mockAppSyncEvent(operationName: string, query: string) {
    return useLambdaEvents({
        request: {
            headers: {
                'x-fingerprint': 'fingerprint:abcdef',
            },
        },
        identity: useLambdaIdentity(Authorizations.API_KEY),
        graphQLParams: {
            operationName,
            query,
        },
    })?.[0] || {}
}

describe('CLIENT #core', () => {
    describe('.connectionString?', () => {
        test('expect Connection String to be configurable via Class options', () => {
            const connectionString = `postgres://${(+new Date()).toString(36).slice(-5)}`
            new PrismaAppSync({ connectionString })
            expect(process.env.DATABASE_URL).toEqual(connectionString)
        })
        test('expect Connection String to be configurable via DATABASE_URL env var', () => {
            process.env.DATABASE_URL = `postgres://${(+new Date()).toString(36).slice(-5)}`
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.connectionString).toEqual(process.env.DATABASE_URL)
        })
    })

    describe('.sanitize?', () => {
        test('expect Sanitize to be TRUE by default', () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
            expect(prismaAppSync.options.sanitize).toEqual(true)
        })
        test('expect Sanitize to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({
                sanitize: false,
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
            expect(prismaAppSync.options.sanitize).toEqual(false)
        })
        test('expect Sanitizer to sanitize inputs', async () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
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
        test('expect Sanitizer to sanitize array inputs', async () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
                maxDepth: 4,
            })
            const event = mockAppSyncEvent(
                'updatePosts',
                `query updatePosts {
                    updatePosts(
                        data: {
                            pins: [
                                { title: "<IMG SRC=\\"javascript:alert('XSS');\\">", order: 1 }
                                { title: "<IMG SRC=\\"javascript:alert('XSS');\\">", order: 3 }
                            ]
                        }
                    ) {
                        title
                    }
                }`,
            )
            const result = await prismaAppSync.resolve({ event })
            const maliciousXss = result?.__prismaAppsync?.QueryParams?.prismaArgs?.data?.pins
            expect(maliciousXss).toEqual([
                { title: '&lt;img src&gt;', order: 1 },
                { title: '&lt;img src&gt;', order: 3 },
            ])
        })
        test('expect Sanitizer to _not_ sanitize inputs', async () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
                sanitize: false,
            })
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
            expect(maliciousXss).toEqual('<IMG SRC="javascript:alert(\'XSS\');">')
        })
        test('expect outputs to be de-sanitize automatically', async () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
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

    describe('.logLevel?', () => {
        test('expect Logging Level to be INFO by default', () => {
            new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
            expect(process.env.PRISMA_APPSYNC_LOG_LEVEL).toEqual('INFO')
        })
        test('expect Logging Level to be configurable via Class options', () => {
            new PrismaAppSync({ connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE', logLevel: 'WARN' })
            expect(process.env.PRISMA_APPSYNC_LOG_LEVEL).toEqual('WARN')
        })
    })

    describe('.defaultPagination?', () => {
        test('expect Pagination to equal 50 by default', () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
            expect(prismaAppSync.options.defaultPagination).toEqual(50)
        })
        test('expect Pagination to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
                defaultPagination: 13,
            })
            expect(prismaAppSync.options.defaultPagination).toEqual(13)
        })
    })

    describe('.maxDepth?', () => {
        test('expect Max Query Depth to equal 3 by default', () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
            expect(prismaAppSync.options.maxDepth).toEqual(3)
        })
        test('expect Max Query Depth to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
                maxDepth: 5,
            })
            expect(prismaAppSync.options.maxDepth).toEqual(5)
        })
    })

    describe('.resolve?', () => {
        test('expect Resolve to return matching Query Params', async () => {
            const prismaAppSync = new PrismaAppSync({
                connectionString: 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
            })
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
                    model: TESTING.PostModel,
                },
                fields: ['title', 'author/username'],
                identity: {},
                operation: 'getPost',
                paths: ['getPost', 'getPost/title', 'getPost/author', 'getPost/author/username'],
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
                headers: {
                    'x-fingerprint': 'fingerprint:abcdef',
                },
            })
        })
    })
})
