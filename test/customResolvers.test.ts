import { PrismaAppSync } from './generated/prisma-appsync/client'
import { merge } from 'lodash'

const payload = require('./data/event.json')
const args = require('./data/args.json')
const contextIdentities = require('./data/identities.json')

describe('Custom resolvers', () => {
    test('Should allow executing custom business logic', async () => {
        let postViews = 0
        const customResolvers = {
            incrementPostsViews: async () => { postViews++ }
        }
        const app = new PrismaAppSync({ connectionUrl: String(), customResolvers })
        app.parseEvent({
            "arguments" : {},
            "info": {
                "fieldName": "incrementPostsViews",
                "selectionSetList": []
            },
        })
        await app.resolve()
        expect(postViews).toEqual(1)
    })

    test('Should pass `args` parameters', async () => {
        let argsParam = null
        const customResolvers = {
            incrementPostsViews: async ({ args }) => { argsParam = args.data }
        }
        const app = new PrismaAppSync({ connectionUrl: String(), customResolvers })
        app.parseEvent({
            "arguments" : payload.arguments,
            "info": {
                "fieldName": "incrementPostsViews",
                "selectionSetList": []
            },
        })
        await app.resolve()
        expect(argsParam).toEqual(args.sanitized.data)
    })

    test('Should pass authIdentity object', async () => {
        let authIdentityParam = null
        const customResolvers = {
            incrementPostsViews: async ({ authIdentity }) => {
                authIdentityParam = authIdentity
            }
        }
        const app = new PrismaAppSync({ connectionUrl: String(), customResolvers })
        app.parseEvent({
            "arguments" : payload.arguments,
            "info": {
                "fieldName": "incrementPostsViews",
                "selectionSetList": []
            },
            "identity": contextIdentities.AMAZON_COGNITO_USER_POOLS
        })
        await app.resolve()
        expect(authIdentityParam).toEqual(
            merge(
                contextIdentities.AMAZON_COGNITO_USER_POOLS,
                { authorization: 'AMAZON_COGNITO_USER_POOLS' }
            )
        )
    })

    test('Should throw when querying API with non-declared resolver', () => {
        expect(() => {
            new PrismaAppSync({ connectionUrl: String() }).parseEvent({
                "arguments" : {},
                "info": {
                    "fieldName": "incrementPostsViews",
                    "selectionSetList": []
                },
            })
        }).toThrow()
    })

    test('Should work with n+1 queries', async () => {
        let argsParam = null
        const customResolvers = {
            listPosts: async ({ args }) => { argsParam = args }
        }
        const app = new PrismaAppSync({ connectionUrl: String(), customResolvers }).parseEvent({
            "arguments" : payload.arguments,
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [
                    "author",
                    "author/username",
                    "author/email",
                ]
            },
        })
        await app.resolve()
        expect(argsParam.select).toEqual({
            "author": {
                "select": {
                    "username": true,
                    "email": true
                }
            }
        })
    })
})