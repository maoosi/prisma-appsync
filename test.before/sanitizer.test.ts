import { PrismaAppSync } from './generated/prisma-appsync/client'

const payload = require('./data/event.json')
const args = require('./data/args.json')

describe('Data sanitizer', () => {
    test('Should prevent XSS attacks by default', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() }).parseEvent(payload)
        const result = await app.resolve()
        expect(result.data).toEqual(args.sanitized.data)
    })

    test('Should not try to sanitize boolean and numbers types', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() }).parseEvent(payload)
        await app.resolve()
        expect(app.adapter.args.select).toEqual(args.sanitized.select)
    })

    test('Should not sanitize data when `sanitize` is disabled', async () => {
        const app = new PrismaAppSync({ connectionUrl: String(), sanitize: false }).parseEvent(payload)
        const result = await app.resolve()
        expect(result.data).toEqual(args.default.data)
    })
})