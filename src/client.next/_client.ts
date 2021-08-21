import { ResolveParams, PrismaAppSyncOptions, ResolverQuery, PrismaClient } from './defs'
import { parseEvent } from './_adapter'
import { canAccess, getApplicableRules } from './_shield'
import * as queries from './_queries'


export class PrismaAppSync {
    private options: PrismaAppSyncOptions
    private event: ResolveParams['event']
    private resolverQuery: ResolverQuery
    private resolvers: {} | null
    private before: ResolveParams['before'] | null
    private after: ResolveParams['after'] | null
    private isFirstResolve: boolean
    public prismaClient:PrismaClient


    /**
     * Instantiate Prisma-AppSync Client.
     * @param  {PrismaAppSyncOptions} options
     */
    constructor(options:PrismaAppSyncOptions) {
        this.isFirstResolve = true

        this.options = {
            connectionUrl: typeof options.connectionUrl !== 'undefined'
                ? options.connectionUrl
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
        }

        this.prismaClient = new PrismaClient()
        
        return this
    }

    
    /**
     * Resolve the API request, based on the AppSync event received by the Direct Lambda Resolver.
     * @param  {ResolveParams} resolveParams
     * @returns Promise
     */
    public async resolve(resolveParams:ResolveParams):Promise<any> {
        // Core :: only read params other than `event` on first .resolve() call
        if (this.isFirstResolve) {
            this.before = resolveParams.before || null
            this.after = resolveParams.after || null
        }

        // Core :: this is not anymore the first .resolve() call
        this.isFirstResolve = false

        // Core :: parse appsync event
        this.event = resolveParams.event
        this.resolverQuery = parseEvent(this.event, this.resolvers)

        // Before :: run before function and extract config
        const beforeConfig = await this.before()

        // Before :: read applicable rules from config
        const rules = getApplicableRules(beforeConfig, this.resolverQuery)

        // Before :: if any of applicable rules shield is equal to `false`, we reject the API call
        if (!canAccess(rules)) {
            new UnauthorizedError(``)
            return;
        }

        // Before :: if any of applicable rules is an object, combine with Prisma query
        if (rule && typeof rule !== 'boolean') {
            this.prismaClient.$use(async (params, next) => {
                // need to merge
                return next(params)
            })
        }

        // Hooks :: execute global beforeResolve hook
        // if (this.beforeResolve) {
        //     this.prismaClient.$use(async (params, next) => {
        //         await this.beforeResolve()
        //         return next(params)
        //     })
        // }

        // Shield :: execute local beforeResolve Shield hook
        // const localBeforeResolve:ShieldDirectivePossibleTypes = this.shield
        //     ? getDirectiveParam(
        //         Shield, this.resolverQuery.subject, 'beforeResolve'
        //     ) : null
        // if (localBeforeResolve && typeof localBeforeResolve === 'function') {
        //     this.prismaClient.$use(async (params, next) => {
        //         await localBeforeResolve()
        //         return next(params)
        //     })
        // }

        // Prisma :: resolve query with Prisma Client
        const results = process.env.JEST_WORKER_ID
            ? this.resolverQuery
            : await queries[`${this.resolverQuery.action}Query`](this.prismaClient, this.resolverQuery)

        // Shield :: execute local afterResolve Shield hook

        // Shield :: filter out fields listed in directive

        // Hooks :: execute global afterResolve hook

        // Core :: return results
        return results
    }
}