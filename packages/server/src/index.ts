import { join } from 'path'
import { readFileSync } from 'fs'
import { cli } from 'cleye'
import { buildSchema } from 'graphql'
import type { Plugin } from '@envelop/types'
import { createServer } from '@graphql-yoga/node'
import { Authorizations } from '../../client/src'
import useLambdaIdentity from './useLambdaIdentity'
import useLambdaEvent from './useLambdaEvent'

const argv = cli({
    name: 'prisma-appsync-server',

    flags: {
        handler: {
            type: String,
            description: 'Lambda handler',
            default: 'handler.ts',
        },
        schema: {
            type: String,
            description: 'GraphQL schema',
            default: 'prisma/generated/prisma-appsync/schema.gql',
        },
        watch: {
            type: [String],
            description: 'Files to watch',
            default: [],
        },
        port: {
            type: Number,
            description: 'Server port',
            default: 4000,
        },
    },
})

const defaultQuery
= /* GraphQL */`query listPosts {
    listPosts {
        id
        title
    }
}
    
mutation createPost {
    createPost(data:{ title: "My first post" }) {
        title
    }
}
`

async function main() {
    const lambdaHandler: any = await import(join(process.cwd(), argv.flags.handler))

    if (!process?.env?.DATABASE_URL)
        throw new Error('Missing "DATABASE_URL" env var.')

    if (!lambdaHandler?.main)
        throw new Error('Handler has no exported function "main".')

    const schema = join(process.cwd(), argv.flags.schema)
    const appsyncScalars = join(__dirname, 'appsync-scalars.gql')
    const appsyncDirectives = join(__dirname, 'appsync-directives.gql')

    const useLambdaFunction = (): Plugin => {
        return {
            async onExecute({ args }) {
                const context: any = args.contextValue

                return {
                    async onExecuteDone({ setResult }) {
                        const request: any = context?.req || {}
                        const query: string = context?.query || String()
                        const operationName: string = context?.operationName || String()
                        const variables: any = context?.variables || {}

                        if (query && operationName !== 'IntrospectionQuery') {
                            const identity = useLambdaIdentity(Authorizations.AWS_IAM || null, {
                                sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
                                username: 'johndoe',
                                sub: 'xxxxxx',
                                resolverContext: {},
                            })

                            const event = useLambdaEvent({
                                request,
                                graphQLParams: {
                                    query,
                                    operationName,
                                    variables,
                                },
                                identity,
                            })

                            const lambdaResult: any = await lambdaHandler.main(
                                event,
                                {
                                    functionName: 'prisma-appsync--handler',
                                    functionVersion: '1',
                                    invokedFunctionArn: 'xxx',
                                    memoryLimitInMB: '1536',
                                    awsRequestId: 'xxx',
                                    logGroupName: 'xxx',
                                    logStreamName: 'xxx',
                                    identity: undefined,
                                    clientContext: undefined,
                                    getRemainingTimeInMillis: () => 10,
                                    done: () => {},
                                    fail: () => {},
                                    succeed: () => {},
                                    callbackWaitsForEmptyEventLoop: false,
                                },
                                () => {},
                            )

                            setResult({ data: { [operationName]: lambdaResult } })
                        }
                    },
                }
            },
        }
    }

    const server = createServer({
        port: argv.flags.port,
        schema: {
            typeDefs: buildSchema([
                readFileSync(appsyncScalars, { encoding: 'utf-8' }),
                readFileSync(appsyncDirectives, { encoding: 'utf-8' }),
                readFileSync(schema, { encoding: 'utf-8' }),
            ].join('\n')),
        },
        graphiql: {
            title: 'Prisma-AppSync',
            defaultQuery,
        },
        plugins: [
            useLambdaFunction(),
        ],
    })

    server.start()
}

process.on('SIGTERM', () => process.exit(0))

main()
