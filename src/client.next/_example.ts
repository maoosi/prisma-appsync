// init prisma-appsync client
const prismaAppSync = new PrismaAppSync({
    connectionString: process.env.DATABASE_URL
})

/**
 * Direct lambda resolver for appsync
 */
export const main = async (event: any, context: any) => {
    // resolve api request
    return await prismaAppSync.resolve({
        event, // AppSync event
        resolvers: {
            // extend CRUD API with a custom query
            myCustomQuery: async ({ prismaClient }) => {
                return await prismaClient.post.count()
            },
            // disabled one of the generated CRUD API query
            getComment: false
        },
        before: ({ authIdentity }) => {
            const isDefaultAllowed = false
            const isAdmin = authIdentity.groups.includes('admin')
            const isOwner = { owner: { cognitoSub: authIdentity.sub } }
    
            return {
                // default (overridden by specific rules)
                '**': isDefaultAllowed,

                // can only be modified by owner
                'modify/{post,comment}{,/**}': {
                    shield: isOwner,
                    reason: ({ model }) => `${model} can only be modified by their owner.`,
                },

                // protected field
                '**/*password{,/**}': {
                    shield: false,
                    reason: () => 'Field password is not accessible.',
                },

                // run code before calling custom resolver
                '**/*myCustomQuery{,/**}': {
                    shield: isAdmin,
                    run: () => {}
                },
            }
        },
        after: () => {
            return {
                'modify/comment': async ({ prismaClient, args, result }) => {
                    await prismaClient.notification.create({ data: args.data })
                    return result
                },
            }
        }
    })
}



// https://www.digitalocean.com/community/tools/glob?comments=true&glob=modify%2F%7Bpost%2Ccomment%7D%7B%2C%2F%2A%2A%7D&matches=false&tests=modify%2Fpost&tests=modify%2Fpost%2Fsecret&tests=modify%2Fpost%2Fsecret%2Fglut&tests=modify%2Fpost%2Fsecret%2Fglut%2Fhello&tests=modify%2Fcomment&tests=modify%2Fuser