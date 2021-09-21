import { PrismaAppSync, AuthModes } from './prisma/generated/prisma-appsync/client'


/**
 * Init prisma-appsync client
 */
const prismaAppSync = new PrismaAppSync({
    connectionString: process.env.DATABASE_URL,
    debug: true
})


/**
 * Direct lambda resolver for appsync
 */
 export const main = async (event: any, context: any) => {

    return await prismaAppSync.resolve<'getComment' | 'notify'>({
        event,
        resolvers: {

            // extend CRUD API with a custom `notify` query
            notify: async () => {
                return { message: 'Hello!' }
            },

            // disabled one of the generated CRUD API query
            getComment: false

        },
        shield: ({ authIdentity }) => {
            const isAdmin = authIdentity?.groups?.includes('admin')
            const isOwner = { owner: { cognitoSub: authIdentity?.sub } }
            const isCognitoAuth = 
                authIdentity.authorization === AuthModes.AMAZON_COGNITO_USER_POOLS
    
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
                'before:modify/post': async ({ prismaClient, args, operation }) => {
                    await prismaClient.hiddenModel.create({ data: args.data })
                    return operation
                },
                'after:getCommentss': async() => {},
                // 'before:notify/postd': async() => {}
            }
        }
    })

}
