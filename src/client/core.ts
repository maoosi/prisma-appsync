import { PrismaAppSyncOptions, Options, PrismaClient, Shield, ShieldAuthorization, ResolveParams } from './defs'
import { parseError, inspect, debug, CustomError } from './inspector'
import { getAuthorization, getDepth } from './guard'
import { parseEvent } from './adapter'
import { isEmpty } from './utils'
import * as queries from './resolver'

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
export class PrismaAppSync {
    private options: Options
    private prismaClient: PrismaClient

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
    constructor(options: PrismaAppSyncOptions) {
        // Set client options using constructor options
        this.options = {
            generatedConfig: {},
            connectionString:
                typeof options.connectionString !== 'undefined'
                    ? options.connectionString
                    : String(process.env.DATABASE_URL),
            sanitize: typeof options.sanitize !== 'undefined' ? options.sanitize : true,
            debug: typeof options.debug !== 'undefined' ? options.debug : true,
            defaultPagination: typeof options.defaultPagination !== 'undefined' ? options.defaultPagination : 50,
            maxDepth: typeof options.maxDepth !== 'undefined' ? options.maxDepth : 3,
        }

        // Try parse auto-injected ENV variable `PRISMA_APPSYNC_GENERATED_CONFIG`
        try {
            if (typeof process.env.PRISMA_APPSYNC_GENERATED_CONFIG !== 'undefined') {
                this.options.generatedConfig = JSON.parse(process.env.PRISMA_APPSYNC_GENERATED_CONFIG)
            }
        } catch (error) {
            throw new CustomError(
                'Issue parsing auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.',
                {
                    type: 'INTERNAL_SERVER_ERROR',
                },
            )
        }

        // Set ENV variable to indicate if debug logs should print
        process.env.PRISMA_APPSYNC_DEBUG = this.options.debug ? 'true' : 'false'

        // Debug logs
        debug(`New instance created using: ${inspect(this.options)}`)

        // Create new Prisma Client
        this.prismaClient = new PrismaClient()
    }

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
     * @param {object} resolveParams.resolvers? - Custom resolvers (to extend the CRUD API).
     * @param {function} resolveParams.shield? - Shield configuration (to protect your API).
     * @param {function} resolveParams.hooks? - Hooks (to trigger functions based on events).
     * @returns Promise<result>
     *
     *
     * Read more in our [docs](https://prisma-appsync.vercel.app).
     */
    public async resolve<CustomResolvers extends string>(resolveParams: ResolveParams<CustomResolvers>): Promise<any> {
        let results: any = null

        try {
            debug(
                `Resolving API request w/ event (shortened): ${inspect({
                    arguments: resolveParams.event.arguments,
                    identity: resolveParams.event.identity,
                    info: resolveParams.event.info,
                })}`,
            )

            // Adapter :: parse appsync event
            const QueryParams = parseEvent(resolveParams.event, this.options, resolveParams.resolvers)
            debug(`Parsed event: ${inspect(QueryParams)}`)

            // Guard :: block queries with a depth > maxDepth
            const depth = getDepth({ paths: QueryParams.paths })
            debug(`Query has depth of ${depth} (max allowed is ${this.options.maxDepth}).`)
            if (depth > this.options.maxDepth) {
                throw new CustomError(
                    `Query has depth of ${depth}, which exceeds max depth of ${this.options.maxDepth}.`,
                    {
                        type: 'FORBIDDEN',
                    },
                )
            }

            // Guard :: create shield from config
            const shield: Shield = resolveParams?.shield ? await resolveParams.shield(QueryParams) : {}

            // Guard :: get authorization object
            const shieldAuth: ShieldAuthorization = getAuthorization({
                shield,
                paths: QueryParams.paths,
            })

            // Guard :: if `canAccess` if equal to `false`, we reject the API call
            if (!shieldAuth.canAccess) {
                const reason = typeof shieldAuth.reason === 'string' ? shieldAuth.reason : shieldAuth.reason()
                throw new CustomError(reason, { type: 'FORBIDDEN' })
            }

            // Guard :: if `prismaFilter` is set, combine with current Prisma query
            if (shieldAuth.prismaFilter) {
                this.prismaClient.$use(async (params, next) => {
                    if (typeof params.args.where !== 'undefined' && params.args.where.length > 0) {
                        params.args.where = {
                            AND: [params.args.where, shieldAuth.prismaFilter],
                        }
                    } else {
                        params.args.where = shieldAuth.prismaFilter
                    }

                    return next(params)
                })
            }

            // Guard: get and run all before hooks functions matching query
            console.log(JSON.stringify(QueryParams, null, 4))

            // Resolver :: resolve query for JEST
            if (process.env.JEST_WORKER_ID) {
                results = QueryParams
            }
            // Resolver :: query is disabled
            else if (
                resolveParams?.resolvers &&
                typeof resolveParams.resolvers[QueryParams.operation] === 'boolean' &&
                resolveParams.resolvers[QueryParams.operation] === false
            ) {
                throw new CustomError(`Query resolver for ${QueryParams.operation} is disabled.`, { type: 'FORBIDDEN' })
            }
            // Resolver :: resolve query with Custom Resolver
            else if (resolveParams?.resolvers && typeof resolveParams.resolvers[QueryParams.operation] === 'function') {
                results = await resolveParams.resolvers[QueryParams.operation](QueryParams)
            }
            // Resolver :: resolve query with built-in CRUD
            else if (!isEmpty(QueryParams?.context?.model)) {
                results = await queries[`${QueryParams.context.action}Query`](this.prismaClient, QueryParams)
            }
            // Resolver :: query resolver not found
            else {
                throw new CustomError(`Query resolver for ${QueryParams.operation} could not be found.`, {
                    type: 'INTERNAL_SERVER_ERROR',
                })
            }

            // Guard: get and run all after hooks functions matching query
        } catch (error) {
            // Return error
            results = Promise.reject(parseError(error))
        }

        return results
    }
}
