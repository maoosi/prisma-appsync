import { join } from 'path'
import { readFileSync } from 'fs'
import { load } from 'js-yaml'
import { argv, createServer } from 'prisma-appsync/dist/server'

(async () => {
    const schema = readFileSync(join(process.cwd(), argv.flags.schema), { encoding: 'utf-8' })
    const lambdaHandler = await import(join(process.cwd(), argv.flags.handler))
    const resolvers = load(readFileSync(join(process.cwd(), argv.flags.resolvers), { encoding: 'utf-8' }))
    const port = argv.flags.port
    const wsPort = argv.flags.wsPort
    const watchers = argv.flags.watchers ? JSON.parse(argv.flags.watchers) : []

    createServer({
        schema,
        lambdaHandler,
        resolvers,
        port,
        wsPort,
        watchers,
    })
})()
