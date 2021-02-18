import { PrismaAppSync } from './generated/prisma-appsync/client'

describe('Prisma Client', () => {
    test('Should be accessible from beforeResolve hook', async () => {
        let prismaDmmfType = null
        const app = new PrismaAppSync({ connectionUrl: String() })
        app.parseEvent({
            "arguments" : {},
            "info": {
                "fieldName": "listPosts",
                "selectionSetList": [ "id", "title", "__typename" ]
            }
        })
        app.beforeResolve(async ({ prisma }: any) => {
            prismaDmmfType = typeof prisma['_dmmf']
            return true
        })
        await app.resolve()
        expect(prismaDmmfType).not.toEqual('undefined')
    })

    test('Should be accessible from custom resolvers', async () => {
        let prismaDmmfType = null
        const app = new PrismaAppSync({
            connectionUrl: String(), 
            customResolvers: {
                incrementPostsViews: async ({ prisma }) => {
                    prismaDmmfType = typeof prisma['_dmmf']
                }
            }
        })
        app.parseEvent({
            "arguments" : {},
            "info": { "fieldName": "incrementPostsViews", "selectionSetList": [] },
        })
        await app.resolve()
        expect(prismaDmmfType).not.toEqual('undefined')
    })
})