import { ResolveParams, PrismaAppSyncOptions, ResolverQuery, PrismaClient, Shield, Authorization } from '../defs'
import { log, UnauthorizedError, InternalError } from '../logger'
import { parseEvent } from './adapter'
import { getAuthorization, getDepth } from './guard'
import * as queries from './resolver'


export class PrismaAppSync {
    private options: PrismaAppSyncOptions
    private event: ResolveParams['event']
    private resolverQuery: ResolverQuery
    private resolvers: {} | null
    private shield: ResolveParams['shield'] | null
    private hooks: ResolveParams['hooks'] | null
    private isFirstResolve: boolean
    public prismaClient:PrismaClient


    /**
     * Instantiate Prisma-AppSync Client.
     * @param  {PrismaAppSyncOptions} options
     */
    constructor(options:PrismaAppSyncOptions) {
        this.isFirstResolve = true

        // Try parse auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`
        let generatedConfig = {}
        try {
            if (typeof process.env.PRISMA_APPSYNC_GENERATED_CONFIG !== 'undefined') {
                generatedConfig = JSON.parse(process.env.PRISMA_APPSYNC_GENERATED_CONFIG)
            }
        } catch (error) {
            new InternalError('Issue parsing auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.')
        }

        // Set client options using constructor options
        this.options = {
            generatedConfig,
            connectionString: typeof options.connectionString !== 'undefined'
                ? options.connectionString
                : String(process.env.DATABASE_URL),
            sanitize: typeof options.sanitize !== 'undefined'
                ? options.sanitize
                : true,
            debug: typeof options.debug !== 'undefined'
                ? options.debug
                : true,
            defaultPagination: typeof options.defaultPagination !== 'undefined'
                ? options.defaultPagination
                : 50,
            maxDepth: typeof options.maxDepth !== 'undefined'
                ? options.maxDepth
                : 3,
        }

        // Set ENV variable to indicate if debug logs should print
        process.env.PRISMA_APPSYNC_DEBUG = this.options.debug ? 'true' : 'false'

        // Debug logs
        log(`Create new instance w/ options: ${JSON.stringify(this.options)}`)

        // Create new Prisma Client
        this.prismaClient = new PrismaClient()
        
        return this
    }

    
    /**
     * Resolve the API request, based on the AppSync event received by the Direct Lambda Resolver.
     * @param  {ResolveParams} resolveParams
     * @returns Promise
     */
    public async resolve(resolveParams:ResolveParams):Promise<any> {
        log(`Resolve API request w/ event: ${JSON.stringify(resolveParams.event)}`)

        // Only read params other than `event` on first .resolve() call
        if (this.isFirstResolve) {
            this.shield = resolveParams.shield || null
            this.hooks = resolveParams.hooks || null
        }

        // This is not anymore the first .resolve() call
        this.isFirstResolve = false

        // Adapter :: parse appsync event
        this.event = resolveParams.event
        this.resolverQuery = parseEvent(this.event, this.resolvers)
        log(`Parsed event: ${JSON.stringify(this.resolverQuery)}`)

        // Guard :: block queries with a depth > maxDepth
        const depth = getDepth({ paths: this.resolverQuery.paths })
        log(`Query has depth of ${depth} (max allowed is ${this.options.maxDepth}).`)
        if (depth > this.options.maxDepth) {
            new UnauthorizedError(`Query has depth of ${depth}, which exceeds max depth of ${this.options.maxDepth}.`)
        }

        // Guard :: create shield from config
        const shield: Shield = await this.shield(this.resolverQuery)

        // Guard :: get authorization object
        const authorization: Authorization = getAuthorization({ shield, paths: this.resolverQuery.paths })

        // Guard :: if `canAccess` if equal to `false`, we reject the API call
        if (!authorization.canAccess) {
            const reason = typeof authorization.reason === 'string'
                ? authorization.reason
                : authorization.reason()
            new UnauthorizedError(reason)
            return;
        }

        // Guard :: if `prismaFilter` is set, combine with current Prisma query
        if (authorization.prismaFilter) {
            this.prismaClient.$use(async (params, next) => {
                if (typeof params.args.where !== 'undefined' && params.args.where.length > 0) {
                    params.args.where = {
                        AND: [
                            params.args.where,
                            authorization.prismaFilter
                        ]
                    }
                } else {
                    params.args.where = authorization.prismaFilter
                }
                
                return next(params)
            })
        }

        // Guard: get and run all before hooks functions matching query

        // Resolver :: resolve query with Prisma Client
        const results = process.env.JEST_WORKER_ID
            ? this.resolverQuery
            : await queries[`${this.resolverQuery.action}Query`](this.prismaClient, this.resolverQuery)

        // Guard: get and run all after hooks functions matching query

        return results
    }
}