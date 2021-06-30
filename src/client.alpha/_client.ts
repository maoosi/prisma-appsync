import { ResolveParams, PrismaAppSyncOptions, ResolverQuery, ShieldDirectivePossibleTypes, PrismaClient } from './defs'
import { parseEvent } from './_adapter'
import { getDirectiveParam } from './_shield'
import * as queries from './_queries'


export class PrismaAppSync {
    private options: PrismaAppSyncOptions
    private event: ResolveParams['event']
    private resolverQuery: ResolverQuery
    private customResolvers: ResolveParams['customResolvers'] | null
    private beforeResolve: ResolveParams['beforeResolve'] | null
    private afterResolve: ResolveParams['afterResolve'] | null
    private shield: ResolveParams['shield'] | null
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
            this.shield = resolveParams.shield || null
            this.customResolvers = resolveParams.customResolvers || null
            this.beforeResolve = resolveParams.beforeResolve || null
            this.afterResolve = resolveParams.afterResolve || null
        }

        // Core :: this is not anymore the first .resolve() call
        this.isFirstResolve = false

        // Core :: parse appsync event
        this.event = resolveParams.event
        this.resolverQuery = parseEvent(this.event, this.customResolvers)

        // Shield :: extract shield directives objects
        const shieldDirectives = await this.shield()

        // Shield :: read applicable rule from the Shield directives
        const rule = this.shield
            ? getDirectiveParam(
                shieldDirectives, { 
                    model: this.resolverQuery.model, 
                    actionAlias: this.resolverQuery.actionAlias
                }, 'rule'
            ) : null

        // Shield :: if applicable rule is equal to `false`, we reject the API call
        if (rule && typeof rule === 'boolean' && rule === false)
            return;

        // Shield :: if applicable rule is an object, combine with Prisma query
        if (rule && typeof rule !== 'boolean') {
            this.prismaClient.$use(async (params, next) => {
                return next(params)
            })
        }

        // Hooks :: execute global beforeResolve hook
        if (this.beforeResolve) {
            this.prismaClient.$use(async (params, next) => {
                await this.beforeResolve()
                return next(params)
            })
        }

        // Shield :: execute local beforeResolve Shield hook
        const localBeforeResolve:ShieldDirectivePossibleTypes = this.shield
            ? getDirectiveParam(
                shieldDirectives, { 
                    model: this.resolverQuery.model, 
                    actionAlias: this.resolverQuery.actionAlias
                }, 'beforeResolve'
            ) : null
        if (localBeforeResolve && typeof localBeforeResolve === 'function') {
            this.prismaClient.$use(async (params, next) => {
                await localBeforeResolve()
                return next(params)
            })
        }

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