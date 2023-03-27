import { describe, expect, test } from 'vitest'
import { getDepth, getShieldAuthorization, runHooks } from '@client/guard'
import { Actions, ActionsAliases, Authorizations } from '@client/defs'
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE'
process.env.PRISMA_APPSYNC_TESTING = 'true'

const TESTING = {
    PostModel: {
        prismaRef: 'post',
        singular: 'Post',
        plural: 'Posts',
    },
}

describe('CLIENT #guard', () => {
    describe('.getShieldAuthorization?', () => {
        test('expect query to be _denied_ by default', async () => {
            const authorization = await getShieldAuthorization({
                shield: { '**': false },
                paths: ['updatePost', 'updatePost/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
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
                paths: ['updatePost', 'updatePost/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
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
                paths: ['updatePost', 'updatePost/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
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
                    'update{Post,Comment,User}{,/**}': {
                        rule: false,
                        reason: ({ model }) => `${model} can only be modified by its owner.`,
                    },
                },
                paths: ['updatePost/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Post can only be modified by its owner.',
                matcher: 'update{Post,Comment,User}{,/**}',
                globPattern: 'update{Post,Comment,User}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be _allowed_ when custom rule overrides **', async () => {
            const authorization = await getShieldAuthorization({
                shield: {
                    '**': false,
                    'updateMany{Posts,Comments,Users}{,/**}': { rule: true },
                },
                paths: ['updateManyPosts', 'updateManyPosts/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: updateMany{Posts,Comments,Users}{,/**}',
                matcher: 'updateMany{Posts,Comments,Users}{,/**}',
                globPattern: 'updateMany{Posts,Comments,Users}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be a _prismaFilter_ when rule is an object', async () => {
            const isOwner = { owner: { cognitoSub: 'xxx' } }

            const authorization = await getShieldAuthorization({
                shield: {
                    '**': false,
                    'update{Post,Comment,User}{,/**}': { rule: isOwner },
                },
                paths: ['updatePost', 'updatePost/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: update{Post,Comment,User}{,/**}',
                matcher: 'update{Post,Comment,User}{,/**}',
                globPattern: 'update{Post,Comment,User}{,/**}',
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
                        model: TESTING.PostModel,
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['updatePost', 'updatePost/title', 'getPost', 'getPost/title'],
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
                        model: TESTING.PostModel,
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['updatePost', 'updatePost/title', 'getPost', 'getPost/title'],
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
                    paths: ['notify', 'notify/message'],
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
                        model: TESTING.PostModel,
                    },
                    fields: ['title'],
                    identity: {},
                    operation: 'updatePost',
                    paths: ['updatePost', 'updatePost/title', 'getPost', 'getPost/title'],
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
                    'listPost',
                    'listPost/id',
                    'listPost/title',
                    'listPost/json',
                    'listPost/author',
                    'listPost/author/name',
                ],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
                fieldsMapping: {},
            })
            expect(depth).toEqual(2)
        })
        test('expect getDepth to return depth, excluding Json fields', () => {
            const depth = getDepth({
                paths: [
                    'createPost',
                    'createPost/title',
                    'createPost/json',
                    'createPost/json/menu',
                    'createPost/json/menu/id',
                    'createPost/json/menu/value',
                    'createPost/json/menu/popup',
                    'createPost/json/menu/popup/menuitem',
                    'getPost',
                    'getPost/title',
                    'getPost/json',
                ],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: TESTING.PostModel,
                },
                fieldsMapping: {
                    'createPost/json': { type: 'Json' },
                    'createPosts/json': { type: 'Json' },
                    'getPost/json': { type: 'Json' },
                },
            })
            expect(depth).toEqual(1)
        })
    })
})
