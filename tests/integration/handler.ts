import { PrismaAppSync, Authorizations } from './prisma/generated/prisma-appsync/client'

/**
 * Init prisma-appsync client
 */
const prismaAppSync = new PrismaAppSync({
    connectionString: process.env.DATABASE_URL,
    debug: true,
})

/**
 * Direct lambda resolver for appsync
 */
export const main = async (event: any, context: any) => {
    return await prismaAppSync.resolve<'listPosts' | 'notify'>({
        event,
        resolvers: {
            // extend CRUD API with a custom `notify` query
            notify: async ({ args }) => {
                return { message: `${args.message} from notify` }
            },

            // disable one of the generated CRUD API query
            listPosts: false,
        },
        shield: ({ authorization, identity }) => {
            const isAdmin = identity?.groups?.includes('admin')
            const isOwner = { owner: { cognitoSub: identity?.sub } }
            const isCognitoAuth = authorization === Authorizations.AMAZON_COGNITO_USER_POOLS

            return {
                // default (overridden by specific rules)
                '**': isCognitoAuth,

                // can only be modified by owner
                'modify/{post,comment}{,/**}': {
                    rule: isOwner,
                    reason: ({ model }) => `${model} can only be modified by their owner.`,
                },

                // protected field
                '**/*password{,/**}': {
                    rule: false,
                    reason: () => 'Field password is not accessible.',
                },

                // run code before calling custom resolver
                '**/*myCustomQuery{,/**}': {
                    rule: isAdmin,
                },
            }
        },
        hooks: () => {
            return {
                'after:modify/post': async ({ prismaClient, prismaArgs, result }) => {
                    await prismaClient.hiddenModel.create({ data: prismaArgs.data })
                    return result
                },
            }
        },
    })
}
