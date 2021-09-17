import { PrismaAppSync } from './generated/prisma-appsync/client'

const payload = require('./data/event.json')

describe('Before resolve hook', () => {
    test('Should block the API query and throw when `false` is returned', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() }).parseEvent(payload)
        app.beforeResolve(async () => { return false })
        await expect(app.resolve()).rejects.toThrow()
    })

    test('Should allow to proceed the API query when `true` is returned', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() }).parseEvent(payload)
        app.beforeResolve(async () => { return true })
        await expect(app.resolve()).resolves.toBeDefined()
    })

    test('Should allow to proceed the API query when nothing is returned', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() }).parseEvent(payload)
        app.beforeResolve(async () => {})
        await expect(app.resolve()).resolves.toBeDefined()
    })
})