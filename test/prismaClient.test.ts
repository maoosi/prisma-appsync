import { PrismaAppSync } from './generated/prisma-appsync/client'
import { PrismaClient } from '@prisma/client'

describe('Prisma Client', () => {
    test('Should be accessible from .prisma', async () => {
        const app = new PrismaAppSync({ connectionUrl: String() })
        const prisma = new PrismaClient()
        expect(app.prisma['_dmmf'].datamodel).toEqual(prisma['_dmmf'].datamodel)
    })
})