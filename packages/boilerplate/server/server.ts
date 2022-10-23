import { join } from 'path'
import { readFileSync } from 'fs'
import { argv, createServer } from 'prisma-appsync/dist/server'

(async () => {
    const schema = readFileSync(join(process.cwd(), argv.flags.schema), { encoding: 'utf-8' })
    const lambdaHandler = await import(join(process.cwd(), argv.flags.handler))
    const port = argv.flags.port
    const watch = argv.flags['watcher-paths']
    const exec = argv.flags['watcher-exec']

    const defaultQuery
= /* GraphQL */`query listPosts {
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
        watch,
        exec,
    })
})()
