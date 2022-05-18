import express from 'express'
import { buildSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'
import { readFileSync } from 'fs'
import { join } from 'path'
import mockIdentity from './mocks/identity'
import mockLambdaEvent from './mocks/lambda-event'
import { Authorization, Authorizations } from '../../client/src'
import nodeWatch from 'node-watch'
import { exec as nodeExec } from 'child_process'

function createServer({
    schema,
    lambdaHandler,
    headers,
    authorization,
    port,
    watch,
}: {
    schema: string
    lambdaHandler: (...args: any) => Promise<any>
    headers?: any
    authorization?: Authorization
    port?: number
    watch?: {
        [fileOrDir: string]: ({
            evt,
            name,
            exec,
        }: {
            evt: any
            name: string
            exec: (command: string, options?: { cwd?: string }) => Promise<{ err: any; strdout: any; stderr: any }>
        }) => Promise<void>
    }
}) {
    const scalars = readFileSync(join(__dirname, 'gql/scalars.gql'), { encoding: 'utf-8' })
    const directives = readFileSync(join(__dirname, 'gql/directives.gql'), { encoding: 'utf-8' })
    const generatedSchema = readFileSync(schema, { encoding: 'utf-8' })
    const gqlSchema = buildSchema(`${scalars}\n${directives}\n${generatedSchema}`)
    const app = express()

    app.use(
        '/graphql',
        graphqlHTTP(async (request, response, graphQLParams) => ({
            schema: gqlSchema,
            rootValue: await getRootValue(request, response, graphQLParams),
            graphiql: {
                headerEditorEnabled: true,
                pretty: true,
                defaultQuery: [
                    `query listPosts {`,
                    `\tlistPosts {`,
                    `\t\tid`,
                    `\t\ttitle`,
                    `\t}`,
                    `}`,
                    ``,
                    `mutation createPost {`,
                    `\tcreatePost(data:{ title: "My first post" }) {`,
                    `\t\ttitle`,
                    `\t}`,
                    `}`,
                ].join('\n'),
            },
        })),
    )

    const portNumber = port || 4000

    app.listen(portNumber)
    console.log(`Running a GraphQL API server at: http://localhost:${portNumber}/graphql`)

    const getRootValue = async (request: any, response: any, graphQLParams: any) => {
        let rootValue: any = {}

        if (graphQLParams.query && graphQLParams.operationName !== 'IntrospectionQuery') {
            const identity = mockIdentity(authorization || null, {
                sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
                username: 'johndoe',
                sub: 'xxxxxx',
                resolverContext: {},
            })

            request.headers = {
                ...(request?.headers || {}),
                headers,
            }

            const event = mockLambdaEvent({
                request,
                graphQLParams,
                identity,
            })

            rootValue[event.info.fieldName] = async () =>
                await lambdaHandler(
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

        return rootValue
    }

    if (watch) {
        const exec = (command: string, options?: { cwd?: string }): Promise<{ err: any; strdout: any; stderr: any }> =>
            new Promise((resolve) => {
                nodeExec(
                    options?.cwd ? `cd ${options.cwd} && ${command}` : command,
                    (err: any, strdout: any, stderr: any) => {
                        if (err) console.error(stderr)
                        else if (strdout) console.log(strdout)
                        resolve({ err, strdout, stderr })
                    },
                )
            })

        for (const fileOrDir in watch) {
            if (Object.prototype.hasOwnProperty.call(watch, fileOrDir)) {
                const func = watch[fileOrDir]

                nodeWatch(
                    fileOrDir,
                    {
                        recursive: true,
                        delay: 1000,
                        filter: (f) => !/node_modules/.test(f),
                    },
                    (evt, name) => {
                        func({ exec, evt, name })
                    },
                )
            }
        }
    }
}

export default createServer
export { Authorizations }
