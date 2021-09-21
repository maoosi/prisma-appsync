import { PrismaAppSyncOptions, PrismaClient, CustomResolveParams } from './defs';
export declare class PrismaAppSync {
    private options;
    private event;
    private resolverQuery;
    private resolvers;
    private shield;
    private hooks;
    private isFirstResolve;
    prismaClient: PrismaClient;
    /**
     * Instantiate Prisma-AppSync Client.
     * @param  {PrismaAppSyncOptions} options
     */
    constructor(options: PrismaAppSyncOptions);
    /**
     * Resolve the API request, based on the AppSync event received by the Direct Lambda Resolver.
     * @param  {ResolveParams} resolveParams
     * @returns Promise
     */
    resolve<CustomResolvers extends string | null>(resolveParams: CustomResolveParams<CustomResolvers>): Promise<any>;
}
