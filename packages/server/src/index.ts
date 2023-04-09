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
import useLambdaEvents from './utils/useLambdaEvents'
import { addTypename } from './utils/useGraphqlTypename'

declare global {
    // eslint-disable-next-line no-var, vars-on-top
    var __prismaAppSyncServer: any
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

    const yogaSchema = createSchema({
        typeDefs: [
            readFileSync(join(__dirname, 'gql/appsync-scalars.gql'), { encoding: 'utf-8' }),
            readFileSync(join(__dirname, 'gql/appsync-directives.gql'), { encoding: 'utf-8' }),
            schema,
        ],
    })

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
                            let prismaAppSyncHeader: any

                            try { prismaAppSyncHeader = JSON.parse(request?.headers?.['x-prisma-appsync']) }
                            catch { prismaAppSyncHeader = {} }

                            const authorization = prismaAppSyncHeader?.authorization || Authorizations.AWS_IAM || null
                            const signature = prismaAppSyncHeader?.signature || {}

                            const identity = useLambdaIdentity(authorization, {
                                ...{
                                    sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
                                    username: 'johndoe',
                                    sub: 'xxxxxx',
                                    resolverContext: {},
                                },
                                ...signature,
                            })

                            request.headers = {
                                ...headers,
                                ...(request?.headers || {}),
                            }

                            const events = useLambdaEvents({
                                request,
                                graphQLParams: {
                                    query,
                                    operationName,
                                    variables,
                                },
                                identity,
                            })

                            const handlers: Promise<any>[] = []

                            for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
                                const event = events[eventIndex]

                                handlers.push(lambdaHandler.main(
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
                                        done: () => { },
                                        fail: () => { },
                                        succeed: () => { },
                                        callbackWaitsForEmptyEventLoop: false,
                                    },
                                    () => { },
                                ))
                            }

                            const handlerResults = await Promise.allSettled(handlers)

                            let lambdaResults: any = {}

                            handlerResults.forEach((handlerResult, eventIndex) => {
                                if (handlerResult.status === 'rejected') {
                                    const error = handlerResult.reason

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
                                else {
                                    lambdaResults = {
                                        ...lambdaResults,
                                        [events[eventIndex].info.fieldName]: handlerResult.value,
                                    }
                                }
                            })

                            const queryDocument = gql`${events[0].info.selectionSetGraphQL}`

                            const filteredResults = queryObject(
                                queryDocument,
                                lambdaResults,
                                { includeMissingData: true },
                            )

                            const typedResults = await addTypename(
                                yogaSchema,
                                filteredResults,
                            )

                            setResult({ data: typedResults })
                        }
                    },
                }
            },
        }
    }

    const yoga = createYoga({
        schema: yogaSchema,
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

    // if (globalThis?.__prismaAppSyncServer?.chokidarInstances) {
    //     for (let i = 0; i < globalThis.__prismaAppSyncServer.chokidarInstances?.length; i++) {
    //         const chok = globalThis.__prismaAppSyncServer.chokidarInstances[i]
    //         await chok?.close()
    //     }
    // }

    if (globalThis?.__prismaAppSyncServer?.serverInstance)
        await globalThis?.__prismaAppSyncServer?.serverInstance?.close()

    const server = createHttpServer(yoga)

    const serverInstance = server
    const chokidarInstances: any[] = []

    if (watchers?.length && !globalThis?.__prismaAppSyncServer?.chokidarInstances) {
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
            const chok = chokidar.watch(watch, {
                ignored: '**/node_modules/**',
                ignoreInitial: true,
                awaitWriteFinish: true,
            })

            chok.on('change', async (path) => {
                console.log(`Change detected on ${path}`)

                if (exec) {
                    console.log(`Executing ${exec}`)
                    await shell(exec)
                }
            })

            chokidarInstances.push(chok)
        })
    }

    server.listen(port, () => {
        console.info(`🧘 Yoga -  Running GraphQL Server at http://localhost:${port}/graphql`)
    })

    globalThis.__prismaAppSyncServer = { serverInstance, chokidarInstances }
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
