import { PrismaAppSync, AuthActions } from './generated/prisma-appsync/client'

describe('Fine-grained access control with CASL', () => {
    test('Should allow list posts using allow rule', async() => {
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments": {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'access', subject: 'Post' })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should allow list posts using mutliple deny + allow rules', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 2 })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments": {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'manage', subject: 'all' })
        app.allow({
            action: 'modify',
            subject: 'Post',
            condition: { authorId: { $eq: currentUserId } } 
        })
        app.deny({
            action: 'get',
            subject: 'Post',
            fields: ['secret'],
            condition: { authorId: { $ne: currentUserId } } 
        })
        app.deny({ action: 'list', subject: 'Post', fields: ['secret'] })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should allow get post using mutliple deny + allow rules', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 1 })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 2 },
            },
            "info": {
                "fieldName": "getPost",
                "selectionSetList": [ "title", "secret", "__typename" ]
            },
        })
        app.allow({ action: 'manage', subject: 'all' })
        app.deny({
            action: 'get',
            subject: 'Post',
            fields: ['secret'],
            condition: { authorId: { $ne: currentUserId } } 
        })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should allow list posts with manage all', async() => {
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments": {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'manage', subject: 'all' })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should deny update post content using allow rule', async() => {
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 2 },
                "data": { "title": "Post title", "content": "Post content" },
            },
            "info": {
                "fieldName": "updatePost",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'access', subject: 'Post', fields: ['title'] })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should deny create a post using allow/deny rule', async() => {
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "data": { "title": "Post title", "content": "Post content" },
            },
            "info": {
                "fieldName": "createPost",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'access', subject: 'Post' })
        app.deny({ action: 'modify', subject: 'Post' })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should deny access specific post fields if the user is not the owner', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 2 })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 5 },
            },
            "info": {
                "fieldName": "getPost",
                "selectionSetList": [ "title", "content", "__typename" ]
            },
        })
        app.allow({ action: 'manage', subject: 'all' })
        app.deny({
            action: 'access',
            subject: 'Post',
            fields: ['content'],
            condition: { authorId: { $ne: currentUserId } }
        })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should deny update a post if the user is not the owner', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 2 })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 2 },
                "data": { "title": "Post title", "content": "Post content" },
            },
            "info": {
                "fieldName": "updatePost",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: 'modify', subject: 'Post', condition: { authorId: currentUserId } })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should allow custom resolver query using allow rule', async() => {
        const app = new PrismaAppSync({
            connectionUrl: String(),
            customResolvers: { incrementPostsViews: async () => { return true } }
        })
        app.parseEvent({
            "arguments": {},
            "info": {
                "fieldName": "incrementPostsViews",
                "selectionSetList": [],
            },
        })
        app.allow({ action: 'custom', subject: 'incrementPostsViews' })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should deny custom resolver query using deny rule', async() => {
        const app = new PrismaAppSync({
            connectionUrl: String(),
            customResolvers: { incrementPostsViews: async () => { return true } }
        })
        app.parseEvent({
            "arguments": {},
            "info": {
                "fieldName": "incrementPostsViews",
                "selectionSetList": [],
            },
        })
        app.allow({ action: 'manage', subject: 'all' })
        app.deny({ action: 'custom', subject: 'incrementPostsViews' })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should allow get a post using multiple conditions', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 2, status: 'PUBLISHED' })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 2 }
            },
            "info": {
                "fieldName": "getPost",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: AuthActions.all, subject: 'all' })
        app.deny({
            action: AuthActions.access,
            subject: 'Post',
            condition: {
                authorId: { $ne: currentUserId },
                status: { $ne: 'PUBLISHED' },
            },
            reason: 'Accessing someone elses unpublished [Post] is not allowed.'
        })

        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should deny get a post using multiple conditions', async() => {
        process.env.JEST_ENTITY = JSON.stringify({ authorId: 2, status: 'DRAFT' })
        const currentUserId = 1
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {
                "where": { "id": 2, "status": "DRAFT" }
            },
            "info": {
                "fieldName": "getPost",
                "selectionSetList": [ "title", "__typename" ]
            },
        })
        app.allow({ action: AuthActions.all, subject: 'all' })
        app.deny({
            action: AuthActions.access,
            subject: 'Post',
            condition: {
                authorId: { $ne: currentUserId },
                status: { $ne: 'PUBLISHED' },
            },
            reason: 'Accessing someone elses unpublished [Post] is not allowed.'
        })

        await expect(app.resolve()).rejects.toThrow()
    })
})