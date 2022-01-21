import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Inject Prisma Models Types
import { Prisma } from '@prisma/client'
type Models = typeof Prisma.ModelName[keyof typeof Prisma.ModelName]

// Instantiate Prisma-AppSync Client
const prismaAppSync = new PrismaAppSync()

// Lambda handler (AppSync Direct Lambda Resolver)
export const main = async (event: any, context: any) => {
    return await prismaAppSync.resolve<Models>({ event })
}
