import { buildSchema } from 'graphql'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { readFileSync } from 'fs'
import { join } from 'path'
import { mockLambdaEvent, mockIdentity } from './appsync'
import { main as lambdaHandler } from './handler'

const scalars = readFileSync(join(__dirname, 'appsync/scalars.gql'), { encoding: 'utf-8' })
const directives = readFileSync(join(__dirname, 'appsync/directives.gql'), { encoding: 'utf-8' })
const generatedSchema = readFileSync(join(__dirname, 'prisma/generated/prisma-appsync/schema.gql'), {
    encoding: 'utf-8',
})
const schema = buildSchema(`${scalars}\n${directives}\n${generatedSchema}`)

const app = express()

app.use(
    '/graphql',
    graphqlHTTP(async (request, response, graphQLParams) => ({
        schema,
        rootValue: await getRootValue(request, response, graphQLParams),
        graphiql: { headerEditorEnabled: true },
    })),
)

app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql')

const getRootValue = async (request, response, graphQLParams) => {
    let rootValue: any = {}

    if (graphQLParams.query && graphQLParams.operationName !== 'IntrospectionQuery') {
        const identity = mockIdentity('AMAZON_COGNITO_USER_POOLS', {
            sourceIp: request?.headers['x-forwarded-for'] || request?.socket?.remoteAddress,
            username: 'johndoe',
            sub: 'xxxxxx',
            resolverContext: {},
        })

        const event = mockLambdaEvent({
            request,
            graphQLParams,
            identity,
        })

        rootValue[event.info.fieldName] = async () => await lambdaHandler(event, null)
    }

    return rootValue
}
