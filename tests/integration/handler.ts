// import PrismaAppSync client
import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'


// init prisma-appsync client
const prismaAppSync = new PrismaAppSync({
    connectionString: process.env.DATABASE_URL,
    debug: true
})


/**
 * Direct lambda resolver for appsync
 */
 export const main = async (event: any, context: any) => {
     let response:any = null

    try {
        // resolve api request
        response = await prismaAppSync.resolve({
            event, // AppSync event
            resolvers: {
                // extend CRUD API with a custom query
                myCustomQuery: async ({ prismaClient }) => {
                    return await prismaClient.post.count()
                },
                // disabled one of the generated CRUD API query
                getComment: false
            },
            shield: ({ authIdentity }) => {
                const isDefaultAllowed = false
                const isAdmin = authIdentity.groups.includes('admin')
                const isOwner = { owner: { cognitoSub: authIdentity.sub } }
        
                return {
                    // default (overridden by specific rules)
                    '**': isDefaultAllowed,

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
                    'after:modify/comment': async ({ prismaClient, args, result }) => {
                        await prismaClient.notification.create({ data: args.data })
                        return result
                    },
                }
            }
        })
    } catch(error) {
        console.error(error)
    }

    return response
}
