import { PrismaAppSyncOptions, ResolveParams } from './defs';
export declare class PrismaAppSync {
    private options;
    private prismaClient;
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
    resolve<CustomResolvers extends string | null>(resolveParams: ResolveParams<CustomResolvers>): Promise<any>;
}
