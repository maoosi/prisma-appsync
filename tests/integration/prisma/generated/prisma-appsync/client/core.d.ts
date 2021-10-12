import { PrismaAppSyncOptions, ResolveParams } from './defs';
/**
 * ##  Prisma-AppSync Client ʲˢ
 *
 * Type-safe Prisma AppSync client for TypeScript & Node.js
 * @example
 * ```
 * const prismaAppSync = new PrismaAppSync()
 *
 * // lambda handler (AppSync Direct Lambda Resolver)
 * export const resolver = async (event: any, context: any) => {
 *     return await prismaAppSync.resolve({ event })
 * }
 * ```
 *
 *
 * Read more in our [docs](https://prisma-appsync.vercel.app).
 */
export declare class PrismaAppSync {
    private options;
    private prismaClient;
    /**
     * ### Client Constructor
     *
     * Instantiate Prisma-AppSync Client.
     * @example
     * ```
     * const prismaAppSync = new PrismaAppSync()
     * ```
     *
     * @param {PrismaAppSyncOptions} options
     * @param {string} options.connectionString? - Prisma connection string (database connection URL).
     * @param {boolean} options.sanitize? - Enable sanitize inputs (parse xss + encode html).
     * @param {boolean} options.debug? - Enable debug logs (visible in CloudWatch).
     * @param {number|false} options.defaultPagination? - Default pagination for list Query (items per page).
     * @param {number} options.maxDepth? - Maximum allowed GraphQL query depth.
     *
     * @default
     * ```
     * {
     *   connectionString: process.env.DATABASE_URL,
     *   sanitize: true,
     *   debug: true,
     *   defaultPagination: 50,
     *   maxDepth: 3,
     * }
     * ```
     *
     *
     * Read more in our [docs](https://prisma-appsync.vercel.app).
     */
    constructor(options: PrismaAppSyncOptions);
    /**
     * ###  Resolver
     *
     * Resolve the API request, based on the AppSync `event` received by the Direct Lambda Resolver.
     * @example
     * ```
     * await prismaAppSync.resolve({ event })
     *
     * // custom resolvers
     * await prismaAppSync.resolve<'notify'|'listPosts'>(
     *     event,
     *     resolvers: {
     *         // extend CRUD API with a custom `notify` query
     *         notify: async ({ args }) => { return { message: args.message } },
     *
     *         // disable one of the generated CRUD API query
     *         listPosts: false,
     *     }
     * })
     * ```
     *
     * @param {ResolveParams} resolveParams
     * @param {any} resolveParams.event - AppSync event received by the Direct Lambda Resolver.
     * @param {any} resolveParams.resolvers? - Custom resolvers (to extend the CRUD API).
     * @param {function} resolveParams.shield? - Shield configuration (to protect your API).
     * @param {function} resolveParams.hooks? - Hooks (to trigger functions based on events).
     * @returns Promise<result>
     *
     *
     * Read more in our [docs](https://prisma-appsync.vercel.app).
     */
    resolve<CustomResolvers extends string>(resolveParams: ResolveParams<CustomResolvers>): Promise<any>;
}
