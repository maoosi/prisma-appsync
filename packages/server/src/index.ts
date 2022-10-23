/* eslint-disable no-console */
import { join } from 'path'
import { closeSync, openSync, readFileSync, utimesSync } from 'fs'
import { exec as nodeExec } from 'child_process'
import { buildSchema } from 'graphql'
import type { Plugin } from '@envelop/types'
import { createServer as graphqlServer } from '@graphql-yoga/node'
import { cli as cleye } from 'cleye'
import chokidar from 'chokidar'
import { Authorizations } from '../../client/src'
import useLambdaIdentity from './utils/useLambdaIdentity'
import useLambdaEvent from './utils/useLambdaEvent'

// npx ts-node-dev ./server.ts --transpile-only
//      --handler handler.ts
//      --schema prisma/generated/prisma-appsync/schema.gql
//      --port 4000
//      --watch ../packages/(client|generator)/**
//      --exec pnpm run build
export const argv = cleye({
    name: 'prisma-appsync-server',
    flags: {
        'handler': {
            type: String,
            description: 'Lambda handler',
            default: 'handler.ts',
        },
        'schema': {
            type: String,
            description: 'GraphQL schema',
            default: 'prisma/generated/prisma-appsync/schema.gql',
        },
        'port': {
            type: Number,
            description: 'Server port',
            default: 4000,
        },
        'watcher-paths': {
            type: [String],
            description: 'Files to watch',
            default: [],
        },
        'watcher-exec': {
            type: String,
            description: 'Exec on watcher detecting changes',
            default: '',
        },
    },
})

export async function createServer({ defaultQuery, lambdaHandler, port, schema, watch, exec }: ServerOptions) {
    process.on('SIGTERM', () => process.exit(0))

    if (!process?.env?.DATABASE_URL)
        throw new Error('Missing "DATABASE_URL" env var.')

    if (!lambdaHandler?.main)
        throw new Error('Handler has no exported function "main".')

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

    const server = graphqlServer({
        port,
        schema: {
            typeDefs: buildSchema([
                readFileSync(join(__dirname, 'gql/appsync-scalars.gql'), { encoding: 'utf-8' }),
                readFileSync(join(__dirname, 'gql/appsync-directives.gql'), { encoding: 'utf-8' }),
                schema,
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

    if (watch?.length) {
        const shell = (command: string): Promise<{ err: any; strdout: any; stderr: any }> =>
            new Promise((resolve) => {
                nodeExec(
                    command,
                    (err: any, strdout: any, stderr: any) => {
                        if (err)
                            console.error(stderr)
                        else if (strdout)
                            console.log(strdout)

                        resolve({ err, strdout, stderr })
                    },
                )
            })

        const touch = (path) => {
            const time = new Date()
            try {
                utimesSync(path, time, time)
            }
            catch (err) {
                closeSync(openSync(path, 'w'))
            }
        }

        const watcher = chokidar.watch(watch, {
            ignored: '**/node_modules/**',
            ignoreInitial: true,
            awaitWriteFinish: true,
        })

        watcher.on('change', async (path) => {
            console.log(`Change detected on ${path}`)

            if (exec) {
                console.log(`Executing ${exec}`)
                await shell(exec)
                touch(__filename)
            }
        })
    }
}

interface ServerOptions {
    schema: string
    lambdaHandler: any
    port: number
    defaultQuery?: string
    watch?: string[]
    exec?: string
}
