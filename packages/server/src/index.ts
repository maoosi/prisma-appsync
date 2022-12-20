/* eslint-disable no-console */
import { join } from 'path'
import { readFileSync } from 'fs'
import { exec as nodeExec } from 'child_process'
import { createServer as createHttpServer } from 'node:http'
import type { Plugin } from '@envelop/types'
import { createSchema, createYoga } from 'graphql-yoga'
import type { YogaServerOptions } from 'graphql-yoga'
import { cli as cleye } from 'cleye'
import chokidar from 'chokidar'
import prettier from 'prettier'
import gql from 'graphql-tag'
import { GraphQLError } from 'graphql'
import { Authorizations } from '../../client/src'
import { queryObject } from './utils/useGraphqlFilter'
import useLambdaIdentity from './utils/useLambdaIdentity'
import useLambdaEvent from './utils/useLambdaEvent'

declare global {
    // eslint-disable-next-line no-var, vars-on-top
    var __server: any
}

// npx vite-node ./server.ts --watch --
//      --handler handler.ts
//      --schema prisma/generated/prisma-appsync/schema.gql
//      --port 4000
//      --watchers '[{"watch":["**/*.prisma","*.prisma"],"exec":"npx prisma generate && touch ./server.ts"}]'
//      --headers '{"x-fingerprint":"123456"}'
export const argv = cleye({
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
        port: {
            type: Number,
            description: 'Server port',
            default: 4000,
        },
        watchers: {
            type: String,
            description: 'Watchers config',
            default: '',
        },
        headers: {
            type: String,
            description: 'HTTP headers',
            default: '',
        },
    },
})

export async function createServer({ defaultQuery, lambdaHandler, port, schema, watchers, headers, yogaServerOptions }: ServerOptions) {
    process.on('SIGTERM', () => process.exit(0))

    if (!process?.env?.DATABASE_URL)
        throw new Error('Missing "DATABASE_URL" env var.')

    if (!lambdaHandler?.main)
        throw new Error('Handler has no exported function "main".')

    const useLambdaFunction = (): Plugin => {
        return {
            async onExecute({ args }) {
                const context: any = args.contextValue
                const variables: any = args?.variableValues || {}
                const operationName: string = args?.operationName || String()
                const query: string = context?.params?.query || {}
                const request: any = context?.req || {}
                return {
                    async onExecuteDone({ setResult }) {
                        if (query && operationName !== 'IntrospectionQuery') {
                            const identity = useLambdaIdentity(Authorizations.AWS_IAM || null, {
                                sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
                                username: 'johndoe',
                                sub: 'xxxxxx',
                                resolverContext: {},
                            })

                            request.headers = {
                                ...(request?.headers || {}),
                                ...headers,
                            }

                            const event = useLambdaEvent({
                                request,
                                graphQLParams: {
                                    query,
                                    operationName,
                                    variables,
                                },
                                identity,
                            })

                            let lambdaResult: any

                            try {
                                lambdaResult = await lambdaHandler.main(
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
                            }
                            catch (error: any) {
                                throw new GraphQLError(String(error?.error || error?.message || error), {
                                    ...(error?.type && {
                                        extensions: {
                                            code: error.type,
                                            ...(error?.code && {
                                                http: {
                                                    status: error.code,
                                                },
                                            }),
                                        },
                                    }),
                                })
                            }

                            const filteredResult = queryObject(
                                gql`${event.info.selectionSetGraphQL}`,
                                { [event.info.fieldName]: lambdaResult },
                                { includeMissingData: true },
                            )

                            setResult({ data: filteredResult })
                        }
                    },
                }
            },
        }
    }

    const yoga = createYoga({
        schema: createSchema({
            typeDefs: [
                readFileSync(join(__dirname, 'gql/appsync-scalars.gql'), { encoding: 'utf-8' }),
                readFileSync(join(__dirname, 'gql/appsync-directives.gql'), { encoding: 'utf-8' }),
                schema,
            ],
        }),
        graphiql: {
            title: 'Prisma-AppSync',
            defaultQuery: defaultQuery ? prettier.format(defaultQuery, { parser: 'graphql' }) : undefined,
            defaultVariableEditorOpen: false,
        },
        plugins: [
            useLambdaFunction(),
        ],
        maskedErrors: false,
        ...(yogaServerOptions || {}),
    })

    if (globalThis.__server)
        await globalThis.__server.close()

    const server = createHttpServer(yoga)

    globalThis.__server = server

    server.listen(port, () => {
        console.info(`🧘 Yoga -  Running GraphQL Server at http://localhost:${port}/graphql`)
    })

    if (watchers?.length) {
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

        watchers.forEach(({ watch, exec }) => {
            chokidar.watch(watch, {
                ignored: '**/node_modules/**',
                ignoreInitial: true,
                awaitWriteFinish: true,
            })
                .on('change', async (path) => {
                    console.log(`Change detected on ${path}`)

                    if (exec) {
                        console.log(`Executing ${exec}`)
                        await shell(exec)
                    }
                })
        })
    }
}

interface ServerOptions {
    schema: string
    lambdaHandler: any
    port: number
    defaultQuery?: string
    headers?: any
    watchers?: { watch: string | string[]; exec: string }[]
    yogaServerOptions?: YogaServerOptions<{}, {}>
}
