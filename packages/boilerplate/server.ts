import createServer, { Authorizations } from 'prisma-appsync/dist/appsync-server'
import { main } from './handler'
import { join } from 'path'

createServer({
    schema: join(__dirname, 'prisma/generated/prisma-appsync/schema.gql'),
    lambdaHandler: main,
    headers: {},
    authorization: Authorizations.AWS_IAM,
    port: 4000
})