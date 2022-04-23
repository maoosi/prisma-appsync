import express from 'express'
import { buildSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'
import { readFileSync } from 'fs'
import { join } from 'path'
import mockIdentity from './mocks/identity'
import mockLambdaEvent from './mocks/lambda-event'
// import { main as lambdaHandler } from '../../functions/api/handler'
// import { Authorizations } from '@prisma-appsync'

const scalars = readFileSync(join(__dirname, 'gql/scalars.gql'), { encoding: 'utf-8' })
const directives = readFileSync(join(__dirname, 'gql/directives.gql'), {
    encoding: 'utf-8',
})
const generatedSchema = readFileSync(
    join(__dirname, '../../services/planetscale/generated/prisma-appsync/schema.gql'),
    {
        encoding: 'utf-8',
    },
)
const schema = buildSchema(`${scalars}\n${directives}\n${generatedSchema}`)

const app = express()

let defaultQuery = `query getUserData {\n`
defaultQuery += `\tgetUserData {\n`
defaultQuery += `\t\tuuid\n`
defaultQuery += `\t}\n`
defaultQuery += `}\n`

app.use(
    '/graphql',
    graphqlHTTP(async (request, response, graphQLParams) => ({
        schema,
        rootValue: await getRootValue(request, response, graphQLParams),
        graphiql: {
            headerEditorEnabled: true,
            defaultQuery,
        },
    })),
)

app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql')

const getRootValue = async (request: any, response: any, graphQLParams: any) => {
    let rootValue: any = {}

    if (graphQLParams.query && graphQLParams.operationName !== 'IntrospectionQuery') {
        const identity = mockIdentity(Authorizations.AWS_IAM, {
            sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
            username: 'johndoe',
            sub: 'xxxxxx',
            resolverContext: {},
        })

        request.headers['x-fingerprint'] = 'sylvain.simao@gmail.com'

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
