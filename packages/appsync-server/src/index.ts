import express from 'express'
import { buildSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'
import { readFileSync } from 'fs'
import { join } from 'path'
import mockIdentity from './mocks/identity'
import mockLambdaEvent from './mocks/lambda-event'
import { Authorization, Authorizations } from '../../client/src'

function createServer({
    schema,
    lambdaHandler,
    headers,
    authorization,
    port
}: {
    schema: string
    lambdaHandler: (...args: any) => Promise<any>
    headers?: any,
    authorization?: Authorization,
    port?: number
}) {
    const scalars = readFileSync(join(__dirname, 'gql/scalars.gql'), { encoding: 'utf-8' })
    const directives = readFileSync(join(__dirname, 'gql/directives.gql'), { encoding: 'utf-8' })
    const generatedSchema = readFileSync(schema, { encoding: 'utf-8' })
    const gqlSchema = buildSchema(`${scalars}\n${directives}\n${generatedSchema}`)
    
    const app = express()
    
    let defaultQuery = `query listPosts {\n`
    defaultQuery += `\tlistPosts {\n`
    defaultQuery += `\t\ttitle\n`
    defaultQuery += `\t}\n`
    defaultQuery += `}\n`
    
    app.use(
        '/graphql',
        graphqlHTTP(async (request, response, graphQLParams) => ({
            schema: gqlSchema,
            rootValue: await getRootValue(request, response, graphQLParams),
            graphiql: {
                headerEditorEnabled: true,
                defaultQuery,
            },
        })),
    )
    
    const portNumber = port || 4000

    app.listen(portNumber)
    console.log(`Running a GraphQL API server at http://localhost:${portNumber}/graphql`)
    
    const getRootValue = async (request: any, response: any, graphQLParams: any) => {
        let rootValue: any = {}
    
        if (graphQLParams.query && graphQLParams.operationName !== 'IntrospectionQuery') {
            const identity = mockIdentity(authorization || null, {
                sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
                username: 'johndoe',
                sub: 'xxxxxx',
                resolverContext: {},
            })

            if (!request?.headers) request.headers = {}

            request.headers = {
                ...request.headers,
                headers
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
                        functionName: 'travis-local-1-anz-fn',
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
    
}

export default createServer
export { Authorizations }