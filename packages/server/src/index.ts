import { cli as cleye } from 'cleye'
import { type ServerOptions, useAppSyncSimulator } from './appsync-simulator'

// npx vite-node ./server.ts --watch --
//      --handler handler.ts
//      --schema prisma/generated/prisma-appsync/schema.gql
//      --resolvers prisma/generated/prisma-appsync/resolvers.yaml
//      --port 4000
//      --wsPort 4001

//      --watchers '[{"watch":["**/*.prisma","*.prisma"],"exec":"npx prisma generate && touch ./server.ts"}]'
//      --headers '{"x-fingerprint":"123456"}'
export const argv = cleye({
    name: 'prisma-appsync-server',
    flags: {
        handler: {
            type: String,
            description: 'Lambda handler (.ts file)',
            default: 'handler.ts',
        },
        schema: {
            type: String,
            description: 'GraphQL schema (.gql file)',
            default: 'generated/prisma-appsync/schema.gql',
        },
        resolvers: {
            type: String,
            description: 'Resolvers (.yaml file)',
            default: 'generated/prisma-appsync/resolvers.yaml',
        },
        port: {
            type: Number,
            description: 'HTTP server port',
            default: 4000,
        },
        wsPort: {
            type: Number,
            description: 'WS server port',
            default: 4001,
        },
    },
})

export async function createServer(serverOptions: ServerOptions) {
    if (!process?.env?.DATABASE_URL)
        throw new Error('Missing "DATABASE_URL" env var.')

    if (!serverOptions?.lambdaHandler?.main)
        throw new Error('Handler has no exported function "main".')

    const simulator = useAppSyncSimulator(serverOptions)

    await simulator.start()

    // @ts-expect-error: 'import.meta' meta-property not allowed
    if (import.meta?.hot) {
        // @ts-expect-error: 'import.meta' meta-property not allowed
        import.meta.hot.on('vite:beforeFullReload', () => {
            // eslint-disable-next-line no-console
            console.log('vite:beforeFullReload')
            simulator.stop()
        })
        // @ts-expect-error: 'import.meta' meta-property not allowed
        import.meta.hot.on('vite:beforeUpdate', () => {
            // eslint-disable-next-line no-console
            console.log('vite:beforeUpdate')
            simulator.stop()
        })
    }

    // eslint-disable-next-line no-console
    console.log(`🧩 GraphQL server at http://localhost:${serverOptions.port}/graphql`)
    // eslint-disable-next-line no-console
    console.log(`🚀 Prisma-AppSync GraphiQL at http://localhost:${serverOptions.port}`)
}

export * from './appsync-simulator'
