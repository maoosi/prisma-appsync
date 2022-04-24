import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Instantiate Prisma-AppSync Client
const prismaAppSync = new PrismaAppSync()

// Lambda handler (AppSync Direct Lambda Resolver)
export const main = async (event: any, context: any) => {
    return await prismaAppSync.resolve({ event })
}
