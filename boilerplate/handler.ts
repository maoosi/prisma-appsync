// Import PrismaAppSync client
import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Initialise client
const app = new PrismaAppSync({
    connectionUrl: process.env.CONNECTION_URL,
    debug: true
})

// Lambda function handler
export const main = async (event: any, context: any, callback: any) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.info('Received event:', JSON.stringify(event))

    try {

        // Parse the `event` from your Lambda function
        app.parseEvent(event)

        // Handle CRUD operations / resolve query
        const result = await app.resolve()
        console.info('Resolver result:', result)

        // Close database connection
        await app.$disconnect()

        // Return query result
        return Promise.resolve(result)

    } catch (error) {

        // Try read private error
        const privateError = typeof error.getLogs === 'function'
            ? error.getLogs() : 'Internal error.'

        // Log private error to CloudWatch
        console.error(`API [${error?.errorType || 'Internal Server Error'}]: `, privateError)

        // Close database connection
        if (app) await app.$disconnect()

        // Return error response
        return Promise.reject(error)

    }
}