// Import PrismaAppSync client
import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Initialise client
const app = new PrismaAppSync({
    connectionUrl: String(process.env.CONNECTION_URL),
    debug: true
})
<% if (testingMode) { %>
// Prisma middleware
app.prisma.$use(async (params, next) => {
    console.log('Hello from Prisma middleware!', params)
    return next(params)
})
<% } %>

// Lambda function handler
export const main = async (event: any, context: any, callback: any) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.info('Received event:', JSON.stringify(event))

    try {
        <% if (testingMode) { %>// Custom resolver
        const incrementPostsViews = 
            async (customResolverParams) => {
                console.log('Hello from incrementPostsViews!', JSON.stringify(customResolverParams))
                return await app.prisma.post.update({
                    data: { views: { increment: 1 } },
                    where: { id: customResolverParams.args.postId }
                })
            }
        app.registerCustomResolvers({ incrementPostsViews })

        <% } %>// Parse the `event` from your Lambda function
        app.parseEvent(event)

        // Handle CRUD operations / resolve query
        const result = await app.resolve()
        console.info('Resolver result:', result)

        // Return query result
        return Promise.resolve(result)

    } catch (error) {

        // Try read private error
        const privateError = typeof error.getLogs === 'function'
            ? error.getLogs() : 'Internal error.'

        // Log private error to CloudWatch
        console.error(`API [${error?.errorType || 'Internal Server Error'}]: `, privateError)

        // Close database connection
        if (app) await app.prisma.$disconnect()

        // Return error response
        return Promise.reject(error)

    }
}