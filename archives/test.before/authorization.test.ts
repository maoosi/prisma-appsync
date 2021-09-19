import { PrismaAppSync } from './generated/prisma-appsync/client'

const contextIdentities = require('./data/identities.json')

describe('AppSync authorization identity', () => {
    test('Should detect `API_KEY` authorization type', async () => {
        let authIdentityDetected = null
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "id", "title", "__typename" ]
            },
            "identity": contextIdentities.API_KEY
        })
        app.beforeResolve(async ({ authIdentity }: any) => {
            authIdentityDetected = authIdentity.authorization
            return true
        })
        await app.resolve()
        expect(authIdentityDetected).toEqual('API_KEY')
    })

    test('Should detect `AWS_IAM` authorization type', async () => {
        let authIdentityDetected = null
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "id", "title", "__typename" ]
            },
            "identity": contextIdentities.AWS_IAM
        })
        app.beforeResolve(async ({ authIdentity }: any) => {
            authIdentityDetected = authIdentity.authorization
            return true
        })
        await app.resolve()
        expect(authIdentityDetected).toEqual('AWS_IAM')
    })

    test('Should detect `AMAZON_COGNITO_USER_POOLS` authorization type', async () => {
        let authIdentityDetected = null
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "id", "title", "__typename" ]
            },
            "identity": contextIdentities.AMAZON_COGNITO_USER_POOLS
        })
        app.beforeResolve(async ({ authIdentity }: any) => {
            authIdentityDetected = authIdentity.authorization
            return true
        })
        await app.resolve()
        expect(authIdentityDetected).toEqual('AMAZON_COGNITO_USER_POOLS')
    })
})