import type {
    AfterHookParams,
    InjectedConfig,
    Options,
    PrismaAppSyncOptionsType,
    ResolveParams,
    Shield,
    ShieldAuthorization,
} from './defs'
import {
    BatchActionsList,
    DebugTestingKey,
    Prisma,
    PrismaClient,
} from './defs'
import { CustomError, log, parseError } from './inspector'
import {
    clarify,
    getDepth,
    getShieldAuthorization,
    preventDOS,
    runHooks,
} from './guard'
import { parseEvent } from './adapter'
import { isEmpty, omit } from './utils'
import { prismaQueryJoin } from './resolver'
import * as queries from './resolver'

/**
 * ##  Auto-injected at generation time
 */
// eslint-disable-next-line spaced-comment
const injectedConfig: InjectedConfig = {} //! inject:config

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
    public prismaClient: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>

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
   * @param {'INFO' | 'WARN' | 'ERROR'} options.logLevel? - Server logs level (visible in CloudWatch).
   * @param {number|false} options.defaultPagination? - Default pagination for list Query (items per page).
   * @param {number} options.maxDepth? - Maximum allowed GraphQL query depth.
   * @param {number} options.maxReqPerUserMinute? - Maximum allowed requests per user, per minute.
   *
   * @default
   * ```
   * {
   *   connectionString: process.env.DATABASE_URL,
   *   sanitize: true,
   *   logLevel: 'INFO',
   *   defaultPagination: 50,
   *   maxDepth: 3,
   *   maxReqPerUserMinute: 200
   * }
   * ```
   *
   *
   * Read more in our [docs](https://prisma-appsync.vercel.app).
   */
    constructor(options?: PrismaAppSyncOptionsType) {
    // Set ENV variable DATABASE_URL if connectionString option is set
        if (typeof options?.connectionString !== 'undefined')
            process.env.DATABASE_URL = options.connectionString

        // Set client options using constructor options
        this.options = {
            modelsMapping: {},
            fieldsMapping: {},
            connectionString: String(process.env.DATABASE_URL),
            sanitize:
                typeof options?.sanitize !== 'undefined'
                    ? options.sanitize
                    : true,
            logLevel:
                typeof options?.logLevel !== 'undefined'
                    ? options.logLevel
                    : 'INFO',
            defaultPagination:
                typeof options?.defaultPagination !== 'undefined'
                    ? options.defaultPagination
                    : 50,
            maxDepth:
                typeof options?.maxDepth !== 'undefined'
                    ? options.maxDepth
                    : 3,
            maxReqPerUserMinute:
                typeof options?.maxReqPerUserMinute !== 'undefined'
                    ? options.maxReqPerUserMinute
                    : 200,
        }

        this.options.modelsMapping = {}

        // Read injected config
        if (injectedConfig?.modelsMapping) {
            this.options.modelsMapping = injectedConfig.modelsMapping
        }
        else if (process?.env?.PRISMA_APPSYNC_INJECTED_CONFIG) {
            try {
                this.options.modelsMapping = JSON.parse(
                    process.env.PRISMA_APPSYNC_INJECTED_CONFIG,
                ).modelsMapping
            }
            catch {}
        }
        if (injectedConfig?.fieldsMapping) {
            this.options.fieldsMapping = injectedConfig.fieldsMapping
        }
        else if (process?.env?.PRISMA_APPSYNC_INJECTED_CONFIG) {
            try {
                this.options.fieldsMapping = JSON.parse(
                    process.env.PRISMA_APPSYNC_INJECTED_CONFIG,
                ).fieldsMapping
            }
            catch {}
        }

        // Make sure injected config isn't empty
        if (Object.keys(this.options.modelsMapping).length === 0) {
            throw new CustomError('Issue with auto-injected models mapping config.', {
                type: 'INTERNAL_SERVER_ERROR',
            })
        }

        // Set ENV variable for log level
        process.env.PRISMA_APPSYNC_LOG_LEVEL = this.options.logLevel

        // Debug logs
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { fieldsMapping, ...newInstanceLogs } = this.options
        log('New Prisma-AppSync instance created:', newInstanceLogs)

        // Prisma client options
        const prismaLogDef: Prisma.LogDefinition[] = [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'info',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ]

        // Create new Prisma Client
        if (process?.env?.PRISMA_APPSYNC_TESTING === 'true') {
            if (!global.prisma)
                global.prisma = new PrismaClient({ log: prismaLogDef })

            this.prismaClient = global.prisma
        }
        else {
            this.prismaClient = new PrismaClient({ log: prismaLogDef })
        }

        // Prisma logs
        if (!(process?.env?.PRISMA_APPSYNC_TESTING === 'true')) {
            this.prismaClient.$on('query', (e: any) => log('Prisma Client query:', e, 'INFO'))
            this.prismaClient.$on('info', (e: any) => log('Prisma Client info:', e, 'INFO'))
            this.prismaClient.$on('warn', (e: any) => log('Prisma Client warn:', e, 'WARN'))
            this.prismaClient.$on('error', (e: any) => log('Prisma Client error:', e, 'ERROR'))
        }
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
    public async resolve<CustomResolvers = void>(
        resolveParams: ResolveParams<'//! inject:type:operations', Extract<CustomResolvers, string>>,
    ): Promise<any> {
        let result: any = null

        try {
            log('Resolving API request w/ event (truncated):', {
                arguments: resolveParams.event.arguments,
                identity: resolveParams.event.identity,
                info: omit(resolveParams.event.info, 'selectionSetGraphQL'),
            })

            // Adapter :: parse appsync event
            let QueryParams = await parseEvent(
                resolveParams.event,
                this.options,
                resolveParams.resolvers,
            )
            log('Parsed event:', QueryParams)

            // Guard :: rate limiting
            const callerUuid
                = (QueryParams.identity as any)?.sourceIp?.[0]
                || (QueryParams.identity as any)?.sourceIp
                || (QueryParams.identity as any)?.sub
                || JSON.stringify(QueryParams.identity)

            if (this.options.maxReqPerUserMinute && callerUuid) {
                const { limitExceeded, count } = await preventDOS({
                    callerUuid,
                    maxReqPerMinute: this.options.maxReqPerUserMinute,
                })
                if (limitExceeded) {
                    throw new CustomError(
                        `Rate limit (maxReqPerUserMinute=${this.options.maxReqPerUserMinute}) exceeded for caller "${callerUuid}".`,
                        {
                            type: 'TOO_MANY_REQUESTS',
                        },
                    )
                }
                else {
                    log(`Rate limit check for caller "${callerUuid}" returned ${count}/${this.options.maxReqPerUserMinute} (last minute).`)
                }
            }

            // Guard :: block queries with a depth > maxDepth
            const depth = getDepth({
                paths: QueryParams.paths,
                context: QueryParams.context,
                fieldsMapping: this.options.fieldsMapping,
            })
            if (depth > this.options.maxDepth) {
                throw new CustomError(
                    `Query has depth of ${depth}, which exceeds max depth of ${this.options.maxDepth}.`,
                    {
                        type: 'FORBIDDEN',
                    },
                )
            }
            else {
                log(`Query has depth of ${depth} (max allowed is ${this.options.maxDepth}).`)
            }

            // Guard :: create shield from config
            const shield: Shield = resolveParams?.shield
                ? await resolveParams.shield(QueryParams)
                : {}

            // Guard :: get shield authorization config
            const shieldAuth: ShieldAuthorization = await getShieldAuthorization({
                shield,
                paths: QueryParams.paths,
                context: QueryParams.context,
            })
            if (Object.keys(shield).length === 0)
                log('Query shield authorization: No Shield setup detected.', null, 'WARN')
            else
                log('Query shield authorization:', shieldAuth)

            // Guard :: if `canAccess` if equal to `false`, we reject the API call
            if (!shieldAuth.canAccess) {
                const reason = typeof shieldAuth.reason === 'string'
                    ? shieldAuth.reason
                    : shieldAuth.reason({
                        action: QueryParams.context.action,
                        model: QueryParams.context.model?.singular || QueryParams.context.action,
                    })
                throw new CustomError(reason, { type: 'FORBIDDEN' })
            }

            // Guard :: if `prismaFilter` is set, combine with current Prisma query
            if (!isEmpty(shieldAuth.prismaFilter)) {
                log('QueryParams before adding Shield filters:', QueryParams)

                QueryParams.prismaArgs = prismaQueryJoin(
                    [QueryParams.prismaArgs, { where: shieldAuth.prismaFilter }],
                    [
                        'where',
                        'data',
                        'orderBy',
                        'skip',
                        'take',
                        'skipDuplicates',
                        'select',
                    ],
                )

                log('QueryParams after adding Shield filters:', QueryParams)
            }

            // Guard: get and run all before hooks functions matching query
            if (!isEmpty(resolveParams?.hooks)) {
                QueryParams = await runHooks({
                    when: 'before',
                    hooks: resolveParams.hooks,
                    prismaClient: this.prismaClient,
                    QueryParams,
                })
            }

            // Resolver :: resolve query for UNIT TESTS
            if (process?.env?.PRISMA_APPSYNC_TESTING === 'true') {
                log('Resolving query for UNIT TESTS.')

                const isBatchAction = BatchActionsList.includes(
                    QueryParams?.context?.action,
                )

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

                if (isBatchAction)
                    result = [getTestResult(), getTestResult()]
                else
                    result = getTestResult()
            }
            // Resolver :: query is disabled
            else if (
                resolveParams?.resolvers
                && typeof resolveParams.resolvers[QueryParams.operation] === 'boolean'
                && resolveParams.resolvers[QueryParams.operation] === false
            ) {
                throw new CustomError(
                    `Query resolver for ${QueryParams.operation} is disabled.`,
                    { type: 'FORBIDDEN' },
                )
            }
            // Resolver :: resolve query with Custom Resolver
            else if (
                typeof resolveParams?.resolvers?.[QueryParams.operation] === 'function'
            ) {
                log(`Resolving query for Custom Resolver "${QueryParams.operation}".`)
                const customResolverFn = resolveParams.resolvers[
                    QueryParams.operation
                ] as Function
                result = await customResolverFn({
                    ...QueryParams,
                    prismaClient: this.prismaClient,
                })
            }
            // Resolver :: resolve query with built-in CRUD
            else if (!isEmpty(QueryParams?.context?.model)) {
                log(`Resolving query for built-in CRUD operation "${QueryParams.operation}".`)

                try {
                    result = await queries[`${QueryParams.context.action}Query`](
                        this.prismaClient,
                        QueryParams,
                    )
                }
                catch (err: any) {
                    if (err instanceof Prisma.PrismaClientKnownRequestError) {
                        throw new CustomError(
                            `Prisma Client known request error${err?.code ? ` (code ${err.code})` : ''}. https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientknownrequesterror`,
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
                        throw new CustomError(
                            'Prisma Client unknown request error. https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientunknownrequesterror',
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                    else if (err instanceof Prisma.PrismaClientRustPanicError) {
                        throw new CustomError(
                            'Prisma Client Rust panic error. https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientrustpanicerror',
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                    else if (err instanceof Prisma.PrismaClientInitializationError) {
                        throw new CustomError(
                            `Prisma Client initialization error${err?.errorCode ? ` (errorCode ${err.errorCode})` : ''}. https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientinitializationerror`,
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                    else if (err instanceof Prisma.PrismaClientValidationError) {
                        throw new CustomError(
                            'Prisma Client validation error. https://www.prisma.io/docs/reference/api-reference/error-reference#prismaclientvalidationerror',
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                    else {
                        throw new CustomError(
                            err?.message?.split('\n')?.pop() || 'Unknown error during query.',
                            { type: 'INTERNAL_SERVER_ERROR', cause: err },
                        )
                    }
                }
            }
            // Resolver :: query resolver not found
            else {
                throw new CustomError(
                    `Query resolver for ${QueryParams.operation} could not be found.`,
                    {
                        type: 'INTERNAL_SERVER_ERROR',
                    },
                )
            }

            // Guard: get and run all after hooks functions matching query
            if (!isEmpty(resolveParams?.hooks)) {
                const q: AfterHookParams = await runHooks({
                    when: 'after',
                    hooks: resolveParams.hooks,
                    prismaClient: this.prismaClient,
                    QueryParams,
                    result,
                })
                result = q.result
            }
        }
        catch (error) {
            // Return error
            return Promise.reject(parseError(error as Error))
        }

        // Guard :: clarify result (decode html)
        const resultClarified = this.options.sanitize ? await clarify(result) : result
        log('Returning response to API request w/ result:', resultClarified)

        return resultClarified
    }
}
