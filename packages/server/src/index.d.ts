import type { YogaServerOptions } from 'graphql-yoga'
import type { AmplifyAppSyncAPIConfig,  AppSyncMockFile, AppSyncSimulatorDataSourceConfig } from 'amplify-appsync-simulator'
import type { PrismaAppsyncResolverConfig} from './amplify-appsync-simulator'
export type { PrismaAppsyncResolverConfig} from './amplify-appsync-simulator'

export const argv: any
export const argv_appsync_simulator: any

export function createServer({
    schema,
    lambdaHandler,
    port,
    defaultQuery,
    watchers
}: {
    schema: string
    lambdaHandler: any
    port: number
    defaultQuery?: string
    headers?: any
    watchers?: { watch: string | string[]; exec: string }[]
    yogaServerOptions?: YogaServerOptions<{}, {}>
}): void


export function createAmplifyAppsyncServer(
    httpPort: number,
    lambdaHandler: any,
    schema: string,
    resolvers: PrismaAppsyncResolverConfig[],
    appsyncConfig?: AmplifyAppSyncAPIConfig,
    additionalMappingTemplates?: AppSyncMockFile[],
    removeDefaultMappingTemplates?: boolean,
    additionalDatasources?: AppSyncSimulatorDataSourceConfig[],
    wsPort?: number
) :Promise<void>
