/* eslint-disable no-console */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exec as nodeExec } from 'child_process'
import chokidar from 'chokidar'
import {
    type AmplifyAppSyncAPIConfig,
    AmplifyAppSyncSimulator,
    AmplifyAppSyncSimulatorAuthenticationType,
    type AmplifyAppSyncSimulatorConfig,
    type AppSyncMockFile,
    type AppSyncSimulatorDataSourceConfig,
    RESOLVER_KIND,
} from 'amplify-appsync-simulator'

declare global {
    // eslint-disable-next-line no-var, vars-on-top
    var __prismaAppSyncServer: any
}

export function useAppSyncSimulator({
    lambdaHandler, schema, resolvers, port, wsPort, watchers, appSync, dataSources,
}: ServerOptions) {
    const mappingTemplates: AppSyncMockFile[] = [{
        path: 'lambdaRequest.vtl',
        content: readFileSync(resolve(__dirname, 'lambdaRequest.vtl'), 'utf8'),
    }, {
        path: 'lambdaResponse.vtl',
        content: readFileSync(resolve(__dirname, 'lambdaResponse.vtl'), 'utf8'),
    }]

    const appSyncWithDefaults: AmplifyAppSyncAPIConfig = {
        name: 'Prisma-AppSync',
        defaultAuthenticationType: {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        apiKey: 'da2-fakeApiId123456', // this is the default for graphiql
        additionalAuthenticationProviders: [],
    }

    const simulatorConfig: AmplifyAppSyncSimulatorConfig = {
        appSync: appSync || appSyncWithDefaults,
        schema: { content: schema },
        mappingTemplates,
        dataSources: dataSources || [{
            type: 'AWS_LAMBDA',
            name: 'prisma-appsync',
            invoke: lambdaHandler.main,
        }],
        resolvers: resolvers.map(resolver => ({
            ...resolver,
            dataSourceName: resolver.dataSource,
            kind: RESOLVER_KIND.UNIT,
            requestMappingTemplateLocation: 'lambdaRequest.vtl',
            responseMappingTemplateLocation: 'lambdaResponse.vtl',
        })),
    }

    if (globalThis?.__prismaAppSyncServer?.serverInstance)
        globalThis?.__prismaAppSyncServer?.serverInstance?.stop()

    const serverInstance = new AmplifyAppSyncSimulator({ port, wsPort })
    const watcherInstances: any[] = globalThis?.__prismaAppSyncServer?.watcherInstances || []

    if (watchers?.length && !globalThis?.__prismaAppSyncServer?.watcherInstances) {
        const shell = (command: string): Promise<{ err: any; strdout: any; stderr: any }> =>
            new Promise((resolve) => {
                nodeExec(
                    command,
                    (err: any, strdout: any, stderr: any) => {
                        if (err)
                            console.error(stderr)
                        else if (strdout)
                            console.log(strdout)

                        resolve({ err, strdout, stderr })
                    },
                )
            })

        watchers.forEach(({ watch, exec }) => {
            const chok = chokidar.watch(watch, {
                ignored: '**/node_modules/**',
                ignoreInitial: true,
                awaitWriteFinish: true,
            })

            chok.on('change', async (path) => {
                console.log(`Change detected on ${path}`)

                if (exec) {
                    console.log(`Executing ${exec}`)
                    await shell(exec)
                }
            })

            watcherInstances.push(chok)
        })
    }

    globalThis.__prismaAppSyncServer = { serverInstance, watcherInstances }

    return {
        start: async () => {
            await globalThis.__prismaAppSyncServer.serverInstance.start()
            globalThis.__prismaAppSyncServer.serverInstance.init(simulatorConfig)
        },
        stop: () => {
            globalThis.__prismaAppSyncServer.serverInstance.stop()
        },
    }
}

export type ServerOptions = {
    // required
    schema: string
    lambdaHandler: any
    resolvers: {
        typeName: string
        fieldName: string
        dataSource: string
        requestMappingTemplate: string
        responseMappingTemplate: string
    }[]
    port: number

    // optional
    wsPort?: number
    watchers?: { watch: string | string[]; exec: string }[]

    // advanced
    appSync?: AmplifyAppSyncAPIConfig
    dataSources?: AppSyncSimulatorDataSourceConfig[]
}

export { AmplifyAppSyncSimulatorAuthenticationType as AuthenticationType }
