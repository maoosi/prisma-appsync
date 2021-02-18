import { PrismaAppSync } from './generated/prisma-appsync/client'

describe('Experimental features', () => {
    test('Should convert DateTime fields to date type', async () => {
        let areCorrectTypes
        const app = new PrismaAppSync({
            connectionUrl: String(), 
            experimental: {
                dateTimeFieldsRegex: /^(lastSaved|updated|created)At$/gim
            }
        })
        app.parseEvent({
            "arguments" : {
                "data": {
                    "lastSavedAt": "2020-11-23T17:41:59+11:00"
                },
                "select": {
                    "lastSavedAt": true
                }
            },
            "info": {
                "fieldName": "updatePost",
                "selectionSetList": []
            },
        })
        app.beforeResolve(async ({ args }) => {
            areCorrectTypes = args.data.lastSavedAt instanceof Date
            return true
        })
        await app.resolve()
        expect(areCorrectTypes).toBeTruthy()
    })
})