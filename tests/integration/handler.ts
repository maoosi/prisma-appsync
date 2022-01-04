import { PrismaAppSync, QueryParams, Authorizations, AfterHookParams } from './prisma/generated/prisma-appsync/client'

/**
 * Inject Prisma Models Types
 */
import { Prisma } from '@prisma/client'
type Models = typeof Prisma.ModelName[keyof typeof Prisma.ModelName]

/**
 * Instantiate Prisma-AppSync Client
 */
const prismaAppSync = new PrismaAppSync({
    connectionString: process.env.DATABASE_URL,
    debug: true,
})

/**
 * Lambda handler (AppSync Direct Lambda Resolver)
 */
export const main = async (event: any, context: any) => {
    return await prismaAppSync.resolve<Models, 'notify'>({
        event,
        resolvers: {
            // Extend the generated CRUD API with a custom Query
            notify: async ({ args }: QueryParams) => {
                return {
                    message: `${args.message} from notify`,
                }
            },
        },
        shield: ({ authorization, identity }: QueryParams) => {
            const isAdmin = identity?.groups?.includes('admin')
            const isOwner = { owner: { cognitoSub: identity?.sub } }
            const isCognitoAuth = authorization === Authorizations.AMAZON_COGNITO_USER_POOLS

            return {
                // By default, access is limited to logged-in Cognito users
                '**': isCognitoAuth,

                // Posts and Comments can only be modified by their owner
                'modify/{post,comment}{,/**}': {
                    rule: isOwner,
                    reason: ({ model }) => `${model} can only be modified by their owner.`,
                },

                // Password field is protected
                '**/*password{,/**}': {
                    rule: false,
                    reason: () => 'Field password is not accessible.',
                },

                // Custom resolver `notify` is restricted to admins
                'notify{,/**}': {
                    rule: isAdmin,
                },
            }
        },
        hooks: () => {
            return {
                // Triggered after a Post is modified
                'after:modify/post': async ({ prismaClient, prismaArgs, result }: AfterHookParams) => {
                    await prismaClient.hiddenModel.create({
                        data: prismaArgs.data,
                    })
                    return result
                },
            }
        },
    })
}
