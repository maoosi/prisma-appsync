import { join } from 'path'
import { readFileSync } from 'fs'
import { argv, createServer } from 'prisma-appsync/dist/server'

(async () => {
    const schema = readFileSync(join(process.cwd(), argv.flags.schema), { encoding: 'utf-8' })
    const lambdaHandler = await import(join(process.cwd(), argv.flags.handler))
    const port = argv.flags.port
    const watchers = argv.flags.watchers ? JSON.parse(argv.flags.watchers) : []
    const headers = argv.flags.headers ? JSON.parse(argv.flags.headers) : {}

    const defaultQuery = /* GraphQL */`
        query listPosts {
            listPosts {
                id
                title
            }
        }
            
        mutation createPost {
            createPost(data:{ title: "My first post" }) {
                title
            }
        }
        `

    createServer({
        schema,
        lambdaHandler,
        defaultQuery,
        port,
        watchers,
        headers,
    })
})()
