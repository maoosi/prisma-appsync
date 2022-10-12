import { join } from 'path'
import createServer, { Authorizations } from 'prisma-appsync/dist/appsync-server'
import { main } from '../handler'

createServer({
    schema: join(__dirname, '{{ relativeGqlSchemaPath }}'),
    lambdaHandler: main,
    headers: {},
    authorization: Authorizations.AWS_IAM,
    port: 4000,
    watch: {
        [join(__dirname, '{{ relativePrismaSchemaPath }}')]: async ({ exec }) => {
            await exec('npx prisma generate', { cwd: join(__dirname, '../') })
        },
    },
})
