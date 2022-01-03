import { PrismaAppSync } from 'packages/client'

// TODO: write more test cases
describe('CLIENT #core', () => {
    describe('.connectionString?', () => {
        test('expect Connection String to be configurable via Class options', () => {
            const connectionString = (+new Date()).toString(36).slice(-5)
            new PrismaAppSync({ connectionString })
            expect(process.env.DATABASE_URL).toEqual(connectionString)
        })
        test('expect Connection String to be configurable via DATABASE_URL env var', () => {
            process.env.DATABASE_URL = (+new Date()).toString(36).slice(-5)
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.connectionString).toEqual(process.env.DATABASE_URL)
        })
    })

    describe('.sanitize?', () => {
        test('expect Sanitize to be TRUE by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.sanitize).toEqual(true)
        })
        test('expect Sanitize to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ sanitize: false })
            expect(prismaAppSync.options.sanitize).toEqual(false)
        })
    })

    describe('.debug?', () => {
        test('expect Debug Logs to be TRUE by default', () => {
            new PrismaAppSync()
            expect(process.env.PRISMA_APPSYNC_DEBUG).toEqual(true)
        })
        test('expect Debug Logs to be configurable via Class options', () => {
            new PrismaAppSync({ debug: false })
            expect(process.env.PRISMA_APPSYNC_DEBUG).toEqual(false)
        })
    })

    describe('.defaultPagination?', () => {
        test('expect Pagination to equal 50 by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.defaultPagination).toEqual(50)
        })
        test('expect Pagination to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ defaultPagination: 13 })
            expect(prismaAppSync.options.defaultPagination).toEqual(13)
        })
    })

    describe('.maxDepth?', () => {
        test('expect Max Query Depth to equal 3 by default', () => {
            const prismaAppSync = new PrismaAppSync()
            expect(prismaAppSync.options.maxDepth).toEqual(3)
        })
        test('expect Max Query Depth to be configurable via Class options', () => {
            const prismaAppSync = new PrismaAppSync({ maxDepth: 5 })
            expect(prismaAppSync.options.maxDepth).toEqual(5)
        })
    })
})
