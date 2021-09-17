import { buildSchema } from 'graphql'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { readFileSync } from 'fs'
import { join } from 'path'
import { mockAppSyncPayload } from './appsync/mockPayload'
import { main } from './handler' 


const scalars = 
    readFileSync(join(__dirname, 'appsync/scalars.gql'), { encoding: 'utf-8' })
const directives = 
    readFileSync(join(__dirname, 'appsync/directives.gql'), { encoding: 'utf-8' })
const schema = 
    readFileSync(join(__dirname, 'prisma/generated/prisma-appsync/schema.gql'), { encoding: 'utf-8' })

const app = express()


const getRootValue = async (request, graphQLParams) => {
    const res = mockAppSyncPayload({
        request,
        graphQLParams,
        mockIdentity: 'AMAZON_COGNITO_USER_POOLS'
    })

    return await main(res.payload, null)
}


app.use(
    '/graphql',
    graphqlHTTP(async (request, response, graphQLParams) => ({
        schema: buildSchema(`
            ${scalars}
            ${directives}
            ${schema}
        `),
        rootValue: await getRootValue(request, graphQLParams),
        graphiql: { headerEditorEnabled: true },
    })),
)


app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
