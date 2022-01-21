import {
    PrismaAppSyncOptionsType,
    Options,
    PrismaClient,
    Shield,
    ShieldAuthorization,
    ResolveParams,
    BatchActionsList,
    DebugTestingKey,
} from './defs'
import { parseError, inspect, debug, CustomError } from './inspector'
import { getShieldAuthorization, getDepth, clarify, runHooks } from './guard'
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
    public options: Options
    public prismaClient: PrismaClient

    /**
     * ### Client Constructor
     *
     * Instantiate Prisma-AppSync Client.
     * @example
     * ```
     * const prismaAppSync = new PrismaAppSync()
     * ```
     *
     * @param {PrismaAppSyncOptionsType} options
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
    constructor(options?: PrismaAppSyncOptionsType) {
        // Set client options using constructor options
        this.options = {
            generatedConfig: {},
            connectionString:
                typeof options?.connectionString !== 'undefined'
                    ? options.connectionString
                    : String(process.env.DATABASE_URL),
            sanitize: typeof options?.sanitize !== 'undefined' ? options.sanitize : true,
            debug: typeof options?.debug !== 'undefined' ? options.debug : true,
            defaultPagination: typeof options?.defaultPagination !== 'undefined' ? options.defaultPagination : 50,
            maxDepth: typeof options?.maxDepth !== 'undefined' ? options.maxDepth : 3,
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

        // Set ENV variable DATABASE_URL if non existing
        if (typeof process.env.DATABASE_URL === 'undefined') {
            process.env.DATABASE_URL = this.options.connectionString
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
     * @param {any} resolveParams.resolvers? - Custom resolvers (to extend the CRUD API).
     * @param {function} resolveParams.shield? - Shield configuration (to protect your API).
     * @param {function} resolveParams.hooks? - Hooks (to trigger functions based on events).
     * @returns Promise<result>
     *
     *
     * Read more in our [docs](https://prisma-appsync.vercel.app).
     */
    public async resolve<Models extends string, CustomResolvers extends string>(
        resolveParams: ResolveParams<Models, CustomResolvers>,
    ): Promise<any> {
        let result: any = null

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
            const depth = getDepth({ paths: QueryParams.paths, context: QueryParams.context })
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

            // Guard :: get shield authorization config
            const shieldAuth: ShieldAuthorization = getShieldAuthorization({
                shield,
                paths: QueryParams.paths,
                context: QueryParams.context,
            })

            // Guard :: if `canAccess` if equal to `false`, we reject the API call
            if (!shieldAuth.canAccess) {
                const reason = typeof shieldAuth.reason === 'string' ? shieldAuth.reason : shieldAuth.reason()
                throw new CustomError(reason, { type: 'FORBIDDEN' })
            }

            // Guard :: if `prismaFilter` is set, combine with current Prisma query
            if (!isEmpty(shieldAuth.prismaFilter)) {
                this.prismaClient.$use(async (params, next) => {
                    if (!isEmpty(params?.args?.where)) {
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
            if (resolveParams?.hooks) {
                await runHooks({
                    when: 'before',
                    hooks: resolveParams.hooks,
                    prismaClient: this.prismaClient,
                    QueryParams,
                })
            }

            // Resolver :: resolve query for UNIT TESTS
            if (process?.env?.PRISMA_APPSYNC_TESTING === 'true') {
                debug(`Resolving query for UNIT TESTS.`)
                const isBatchAction = BatchActionsList.includes(QueryParams?.context?.action)

                const getTestResult = () => {
                    return {
                        ...QueryParams.fields.reduce((a, v) => {
                            const value = !isEmpty(QueryParams?.prismaArgs?.data?.[v])
                                ? QueryParams.prismaArgs.data[v]
                                : (Math.random() + 1).toString(36).substring(7)

                            return { ...a, [v]: String(value) }
                        }, {}),
                        [DebugTestingKey]: {
                            QueryParams,
                        },
                    }
                }

                if (isBatchAction) {
                    result = [getTestResult(), getTestResult()]
                } else {
                    result = getTestResult()
                }
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
                debug(`Resolving query for Custom Resolver "${QueryParams.operation}".`)
                result = await resolveParams.resolvers[QueryParams.operation](QueryParams)
            }
            // Resolver :: resolve query with built-in CRUD
            else if (!isEmpty(QueryParams?.context?.model)) {
                debug(`Resolving query for built-in CRUD operation "${QueryParams.operation}".`)
                result = await queries[`${QueryParams.context.action}Query`](this.prismaClient, QueryParams)
            }
            // Resolver :: query resolver not found
            else {
                throw new CustomError(`Query resolver for ${QueryParams.operation} could not be found.`, {
                    type: 'INTERNAL_SERVER_ERROR',
                })
            }

            // Guard: get and run all after hooks functions matching query
            if (resolveParams?.hooks) {
                result = await runHooks({
                    when: 'after',
                    hooks: resolveParams.hooks,
                    prismaClient: this.prismaClient,
                    QueryParams,
                    result,
                })
            }
        } catch (error) {
            // Return error
            result = Promise.reject(parseError(error))
        }

        // Guard :: clarify result (decode html)
        const resultClarified = this.options.sanitize ? clarify(result) : result

        debug(`Returning response to API request w/ result: ${inspect(resultClarified)}`)
        return resultClarified
    }
}
