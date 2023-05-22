import type { AmplifyAppSyncAPIConfig, AmplifyAppSyncSimulatorConfig, AppSyncMockFile, AppSyncSimulatorDataSourceConfig, AppSyncSimulatorPipelineResolverConfig, AppSyncSimulatorUnitResolverConfig } from 'amplify-appsync-simulator'

import {
    AmplifyAppSyncSimulator,
    AmplifyAppSyncSimulatorAuthenticationType,
    RESOLVER_KIND,
} from 'amplify-appsync-simulator'
import { cli as cleye } from 'cleye'
import { readVTL } from '../vtl/readVTL'

// npx vite-node ./server.ts --watch --
//      --handler handler.ts
//      --schema prisma/generated/prisma-appsync/schema.gql
//      --resolvers prisma/generated/prisma-appsync/resolvers.yaml
//      --httpPort 4000
//      --wsPort 4001
//      --watchers '[{"watch":["**/*.prisma","*.prisma"],"exec":"npx prisma generate && touch ./server.ts"}]'
//      --headers '{"x-fingerprint":"123456"}'
export const argv_appsync_simulator = cleye({
    name: 'prisma-appsync-server',
    flags: {
        handler: {
            type: String,
            description: 'Lambda handler',
            default: 'handler.ts',
        },
        schema: {
            type: String,
            description: 'GraphQL schema',
            default: 'generated/prisma-appsync/schema.gql',
        },
        resolvers: {
            type: String,
            description: 'Resolvers',
            default: 'generated/prisma-appsync/resolvers.yaml',
        },
        httpPort: {
            type: Number,
            description: 'Server port',
            default: 4000,
        },
        wsPort: {
            type: Number,
            description: 'Ws port',
            default: 4001,
        },
    },
})

export interface PrismaAppsyncResolverConfig {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate: string
    responseMappingTemplate: string
}

class AppSyncSimulator {
    mappingTemplates: AppSyncMockFile[]

    private defaultMappingTemplates: AppSyncMockFile[] = [
        {
            path: 'lambdaRequestMappingTemplate.vtl',
            content: readVTL('lambdaRequestMappingTemplate.vtl'),
        },
        {
            path: 'lambdaResponseMappingTemplate.vtl',
            content: readVTL('lambdaResponseMappingTemplate.vtl'),
        },
    ]

    private appsyncConfig: AmplifyAppSyncAPIConfig = {
        defaultAuthenticationType: {
            authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        apiKey: 'da2-fakeApiId123456', // this is the default for graphiql
        name: 'api-local',
        additionalAuthenticationProviders: [],
    }

    constructor(
        private httpPort: number,
        private lambdaHandler: any,
        private schema: string,
        private resolvers: PrismaAppsyncResolverConfig[],
        appsyncConfig?: AmplifyAppSyncAPIConfig,
        additionalMappingTemplates: AppSyncMockFile[] = [],
        removeDefaultMappingTemplates = false,
        private additionalDatasources: AppSyncSimulatorDataSourceConfig[] = [],
        private wsPort?: number,
    ) {
        if (!process?.env?.DATABASE_URL)
            throw new Error('Missing "DATABASE_URL" env var.')

        if (!this.lambdaHandler?.main)
            throw new Error('Handler has no exported function "main".')

        if (appsyncConfig)
            this.appsyncConfig = appsyncConfig

        this.mappingTemplates = removeDefaultMappingTemplates ? additionalMappingTemplates : this.defaultMappingTemplates.concat(additionalMappingTemplates)
    }

    private static createPrismaAppSyncResolvers(resolvers: PrismaAppsyncResolverConfig[]): (AppSyncSimulatorPipelineResolverConfig | AppSyncSimulatorUnitResolverConfig)[] {
        return resolvers.map((resolver: PrismaAppsyncResolverConfig) => ({
            ...resolver,
            dataSourceName: resolver.dataSource,
            kind: RESOLVER_KIND.UNIT,
            requestMappingTemplateLocation: 'lambdaRequestMappingTemplate.vtl',
            responseMappingTemplateLocation: 'lambdaResponseMappingTemplate.vtl',
        }))
    }

    async start() {
        const simulatorConfig: AmplifyAppSyncSimulatorConfig = {
            appSync: this.appsyncConfig,
            schema: { content: this.schema },
            mappingTemplates: this.mappingTemplates,
            dataSources: [
                {
                    type: 'AWS_LAMBDA',
                    name: 'prisma-appsync',
                    invoke: this.lambdaHandler.main,
                },
                ...this.additionalDatasources,

            ],
            resolvers: AppSyncSimulator.createPrismaAppSyncResolvers(this.resolvers),
        }

        const amplifySimulator = new AmplifyAppSyncSimulator({
            port: this.httpPort,
            wsPort: this.wsPort,
        })
        await amplifySimulator.start()
        amplifySimulator.init(simulatorConfig)
    }
}

export async function createAmplifyAppsyncServer(
    httpPort: number,
    lambdaHandler: any,
    schema: string,
    resolvers: PrismaAppsyncResolverConfig[],
    appsyncConfig?: AmplifyAppSyncAPIConfig,
    additionalMappingTemplates: AppSyncMockFile[] = [],
    removeDefaultMappingTemplates = false,
    additionalDatasources: AppSyncSimulatorDataSourceConfig[] = [],
    wsPort?: number,
) {
    const simulator = new AppSyncSimulator(httpPort, lambdaHandler, schema, resolvers, appsyncConfig, additionalMappingTemplates, removeDefaultMappingTemplates, additionalDatasources, wsPort)

    await simulator.start()
    // eslint-disable-next-line no-console
    console.log(`🚀 App Sync Simulator started at http://localhost:${httpPort}`)
}

