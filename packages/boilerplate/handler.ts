import type { AppSyncResolverEvent } from './prisma/generated/prisma-appsync/client'
import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Instantiate Prisma-AppSync Client
const prismaAppSync = new PrismaAppSync()

// Lambda handler (AppSync Direct Lambda Resolver)
export const main = async (event: AppSyncResolverEvent<any>) => {
    return await prismaAppSync.resolve({ event })
}
