import { describe, expect, test } from 'vitest'
import { getDepth, getShieldAuthorization, runHooks } from '@client/guard'
import type { Options } from '@client/defs'
import { Actions, ActionsAliases, Authorizations } from '@client/defs'
import { Prisma, PrismaClient } from '@prisma/client'

const Models = Prisma.ModelName

process.env.DATABASE_URL = 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE'
process.env.PRISMA_APPSYNC_TESTING = 'true'

const options: Options = {
    connectionString: 'xxx',
    sanitize: true,
    logLevel: 'INFO',
    defaultPagination: false,
    maxDepth: 3,
    modelsMapping: { Post: 'post', Posts: 'post' },
    fieldsMapping: {},
    maxReqPerUserMinute: 200,
}

describe('CLIENT #guard', () => {
    describe('.getShieldAuthorization?', () => {
        test('expect query to be _denied_ by default', async () => {
            const authorization = await getShieldAuthorization({
                shield: { '**': false },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _denied_ when ** is false', async () => {
            const authorization = await getShieldAuthorization({
                shield: { '**': false },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _allowed_ when ** is true', async () => {
            const authorization = await getShieldAuthorization({
                shield: { '**': true },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _denied_ when custom rule overrides **', async () => {
            const authorization = await getShieldAuthorization({
                shield: {
                    '**': true,
                    '/update{Post,Comment,User}{,/**}': {
                        rule: false,
                        reason: ({ model }) => `${model} can only be modified by its owner.`,
                    },
                },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Post can only be modified by its owner.',
                matcher: '/update{Post,Comment,User}{,/**}',
                globPattern: '/update{Post,Comment,User}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be _allowed_ when custom rule overrides **', async () => {
            const authorization = await getShieldAuthorization({
                shield: {
                    '**': false,
                    '/updateMany{Posts,Comments,Users}{,/**}': { rule: true },
                },
                paths: ['/updateMany/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: /updateMany{Posts,Comments,Users}{,/**}',
                matcher: '/updateMany{Posts,Comments,Users}{,/**}',
                globPattern: '/updateMany{Posts,Comments,Users}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be a _prismaFilter_ when rule is an object', async () => {
            const isOwner = { owner: { cognitoSub: 'xxx' } }

            const authorization = await getShieldAuthorization({
                shield: {
                    '**': false,
                    '/update{Post,Comment,User}{,/**}': { rule: isOwner },
                },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                options,
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: /update{Post,Comment,User}{,/**}',
                matcher: '/update{Post,Comment,User}{,/**}',
                globPattern: '/update{Post,Comment,User}{,/**}',
                prismaFilter: isOwner,
            })
        })
    })

    describe('.runHooks?', () => {
        test('expect "before:updatePost" to run _before_ "updatePost"', async () => {
            const hookResponse = await runHooks({
                when: 'before',
                hooks: {
                    'before:updatePost': async (data) => {
                        data.test = 'before:updatePost'
                        return data
                    },
                },
                prismaClient: new PrismaClient(),
                QueryParams: {
                    headers: {},
                    args: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                    },
                    authorization: Authorizations.API_KEY,
                    context: {
                        action: Actions.update,
                        alias: ActionsAliases.modify,
                        model: Models.Post.toLowerCase(),
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['/update/post/title', '/get/post/title'],
                    prismaArgs: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                        select: { title: true },
                    },
                    type: 'Mutation',
                },
            })

            expect(hookResponse.test).toEqual('before:updatePost')
        })

        test('expect "after:updatePost" to run _after_ "updatePost" and modify result', async () => {
            const hookResponse = await runHooks({
                when: 'after',
                hooks: {
                    'after:updatePost': async (params) => {
                        return { ...params, result: 'after:updatePost' }
                    },
                },
                prismaClient: new PrismaClient(),
                QueryParams: {
                    headers: {},
                    args: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                    },
                    authorization: Authorizations.API_KEY,
                    context: {
                        action: Actions.update,
                        alias: ActionsAliases.modify,
                        model: Models.Post.toLowerCase(),
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['/update/post/title', '/get/post/title'],
                    prismaArgs: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                        select: { title: true },
                    },
                    type: 'Mutation',
                },
                result: 'hello',
            })

            expect(hookResponse.result).toEqual('after:updatePost')
        })

        test('expect "before:notify" to run _before_ "notify"', async () => {
            let testValue: any = false
            await runHooks({
                when: 'before',
                hooks: {
                    'before:notify': async () => {
                        testValue = 'before:notify'
                    },
                },
                prismaClient: new PrismaClient(),
                QueryParams: {
                    headers: {},
                    args: {
                        message: 'Hello world',
                    },
                    authorization: Authorizations.API_KEY,
                    context: {
                        action: 'notify',
                        alias: 'custom',
                        model: null,
                    },
                    fields: ['message'],
                    identity: {},
                    operation: 'notify',
                    paths: ['/notify/message'],
                    prismaArgs: {
                        select: { message: true },
                    },
                    type: 'Mutation',
                },
            })

            expect(testValue).toEqual('before:notify')
        })

        test('expect "before:**" to run _before_ everything', async () => {
            let testValue: any = false
            await runHooks({
                when: 'before',
                hooks: {
                    'before:**': async () => {
                        testValue = 'before:**'
                    },
                },
                prismaClient: new PrismaClient(),
                QueryParams: {
                    headers: {},
                    args: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                    },
                    authorization: Authorizations.API_KEY,
                    context: {
                        action: Actions.update,
                        alias: ActionsAliases.modify,
                        model: Models.Post.toLowerCase(),
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['/update/post/title', '/get/post/title'],
                    prismaArgs: {
                        where: { id: 1 },
                        data: { title: 'New title' },
                        select: { title: true },
                    },
                    type: 'Mutation',
                },
            })

            expect(testValue).toEqual('before:**')
        })
    })

    describe('.getDepth?', () => {
        test('expect getDepth to return depth', () => {
            const depth = getDepth({
                paths: [
                    '/list/post/id',
                    '/list/post/title',
                    '/list/post/json',
                    '/list/post/author/name',
                ],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                fieldsMapping: {},
            })
            expect(depth).toEqual(2)
        })
        test('expect getDepth to return depth, excluding Json fields', () => {
            const depth = getDepth({
                paths: [
                    '/create/post/title',
                    '/create/post/json/menu/id',
                    '/create/post/json/menu/value',
                    '/create/post/json/menu/popup/menuitem',
                    '/get/post/title',
                    '/get/post/json',
                ],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
                fieldsMapping: {
                    'post/json': { type: 'Json' },
                    'posts/json': { type: 'Json' },
                },
            })
            expect(depth).toEqual(1)
        })
    })
})
