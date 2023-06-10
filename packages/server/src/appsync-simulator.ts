import type {
    AmplifyAppSyncAPIConfig,
    AmplifyAppSyncSimulatorConfig,
    AppSyncMockFile,
} from 'amplify-appsync-simulator'
import {
    AmplifyAppSyncSimulator,
    AmplifyAppSyncSimulatorAuthenticationType,
    RESOLVER_KIND,
} from 'amplify-appsync-simulator'
import { readVTL } from './vtl/readVTL'

export function useAppSyncSimulator({
    lambdaHandler, schema, resolvers, port, wsPort,
}: ServerOptions) {
    const mappingTemplates: AppSyncMockFile[] = [{
        path: 'lambdaRequestMappingTemplate.vtl',
        content: readVTL('lambdaRequestMappingTemplate.vtl'),
    }, {
        path: 'lambdaResponseMappingTemplate.vtl',
        content: readVTL('lambdaResponseMappingTemplate.vtl'),
    }]

    const appSync: AmplifyAppSyncAPIConfig = {
        defaultAuthenticationType: {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        apiKey: 'da2-fakeApiId123456', // this is the default for graphiql
        name: 'Prisma-AppSync',
        additionalAuthenticationProviders: [],
    }

    const simulatorConfig: AmplifyAppSyncSimulatorConfig = {
        appSync,
        schema: { content: schema },
        mappingTemplates,
        dataSources: [{
            type: 'AWS_LAMBDA',
            name: 'prisma-appsync',
            invoke: lambdaHandler.main,
        }],
        resolvers: resolvers.map(resolver => ({
            ...resolver,
            dataSourceName: resolver.dataSource,
            kind: RESOLVER_KIND.UNIT,
            requestMappingTemplateLocation: 'lambdaRequestMappingTemplate.vtl',
            responseMappingTemplateLocation: 'lambdaResponseMappingTemplate.vtl',
        })),
    }

    const amplifySimulator = new AmplifyAppSyncSimulator({ port, wsPort })

    return {
        start: async () => {
            await amplifySimulator.start()
            amplifySimulator.init(simulatorConfig)
        },
        stop: () => {
            amplifySimulator.stop()
        },
    }
}

export type ServerOptions = {
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
    wsPort?: number
    defaultQuery?: string
    headers?: any
    watchers?: { watch: string | string[]; exec: string }[]
}
