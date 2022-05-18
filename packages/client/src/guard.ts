import {
    PrismaClient,
    ShieldAuthorization,
    Shield,
    Context,
    QueryParams,
    DebugTestingKey,
    ActionsList,
    BatchActionsList,
    Options,
} from './defs'
import { merge, encode, decode, filterXSS, isMatchingGlob, traverse, upperFirst } from './utils'
import { CustomError } from './inspector'

/**
 * #### Sanitize data (parse xss + encode html).
 *
 * @param {any} data
 * @returns any
 */
export function sanitize(data: any): any {
    return traverse(data, (value, key) => {
        let excludeChilds = false

        if (typeof key === 'string' && key === DebugTestingKey) {
            excludeChilds = true
        }
        if (typeof value === 'string') {
            value = encode(filterXSS(value))
        }

        return { value, excludeChilds }
    })
}

/**
 * #### Clarify data (decode html).
 *
 * @param {any} data
 * @returns any
 */
export function clarify(data: any): any {
    return traverse(data, (value, key) => {
        let excludeChilds = false

        if (typeof key === 'string' && key === DebugTestingKey) {
            excludeChilds = true
        }
        if (typeof value === 'string') {
            value = decode(value)
        }

        return { value, excludeChilds }
    })
}

/**
 * #### Returns an authorization object from a Shield configuration passed as input.
 *
 * @param {any} options
 * @param {Shield} options.shield
 * @param {string[]} options.paths
 * @param {Context} options.context
 * @returns ShieldAuthorization
 */
export function getShieldAuthorization({
    shield,
    paths,
    context,
    options,
}: {
    shield: Shield
    paths: string[]
    context: Context
    options: Options
}): ShieldAuthorization {
    const authorization: ShieldAuthorization = {
        canAccess: true,
        reason: String(),
        prismaFilter: {},
        matcher: String(),
        globPattern: String(),
    }

    let modelSingular = context.model ? upperFirst(context.model!) : String()
    let modelPlural = modelSingular

    if (options?.modelsMapping && modelSingular) {
        const models: any[] = Object.keys(options.modelsMapping)
        const modelPluralMatch = models.find((key: string) => {
            return options.modelsMapping[key] === modelSingular.toLowerCase() && key !== upperFirst(modelSingular)
        })
        if (modelPluralMatch) modelPlural = modelPluralMatch
    }

    const shieldPaths = paths.map((path: string) => {
        if (context.model) {
            BatchActionsList.forEach((batchAction: string) => {
                path = path.replace(
                    `${batchAction}/${modelSingular.toLowerCase()}`,
                    `${batchAction}${upperFirst(modelPlural)}`,
                )
            })
            ActionsList.forEach((action: string) => {
                path = path.replace(`${action}/${modelSingular.toLowerCase()}`, `${action}${upperFirst(modelSingular)}`)
            })
        }
        return path
    })

    for (let i = shieldPaths.length - 1; i >= 0; i--) {
        let shieldPath: string = shieldPaths[i]

        for (const matcher in shield) {
            let globPattern = matcher

            if (!globPattern.startsWith('/') && globPattern !== '**') globPattern = `/${globPattern}`

            if (isMatchingGlob(shieldPath, globPattern)) {
                const shieldRule = shield[matcher]

                if (typeof shieldRule === 'boolean') {
                    authorization.canAccess = shield[matcher] as boolean
                } else {
                    if (typeof shieldRule.rule === 'undefined') {
                        throw new CustomError(`Badly formed shield rule.`, { type: 'INTERNAL_SERVER_ERROR' })
                    }

                    if (typeof shieldRule.rule === 'boolean') {
                        authorization.canAccess = shieldRule.rule
                    } else {
                        authorization.canAccess = true
                        if (!authorization.prismaFilter) {
                            authorization.prismaFilter = {}
                        }
                        authorization.prismaFilter = merge(authorization.prismaFilter, shieldRule.rule)
                    }
                }

                authorization.matcher = matcher
                authorization.globPattern = globPattern

                const isReasonDefined = typeof shieldRule !== 'boolean' && typeof shieldRule.reason !== 'undefined'
                let reason = `Matcher: ${authorization.matcher}`

                if (isReasonDefined && typeof shieldRule.reason === 'function') {
                    reason = shieldRule.reason(context)
                } else if (isReasonDefined && typeof shieldRule.reason === 'string') {
                    reason = shieldRule.reason
                }

                authorization.reason = reason
            }
        }
    }

    return authorization
}

/**
 * #### Returns GraphQL query depth for any given Query.
 *
 * @param {any} options
 * @param {string[]} options.paths
 * @param {Context} options.context
 * @returns number
 */
export function getDepth({ paths, context }: { paths: string[]; context: Context }): number {
    let depth = 0

    paths.forEach((path: string) => {
        const pathDepth = path.split('/').length - 3
        if (pathDepth > depth) depth = pathDepth
    })

    if (context.model === null) depth += 1

    return depth
}

/**
 * #### Execute hooks that apply to a given Query.
 *
 * @param {any} options
 * @param {'before' | 'after'} options.when
 * @param {any} options.hooks
 * @param {PrismaClient} options.prismaClient
 * @param {QueryParams} options.QueryParams
 * @param {any | any[]} options.result
 * @returns Promise<void | any>
 */
export async function runHooks({
    when,
    hooks,
    prismaClient,
    QueryParams,
    result,
}: {
    when: 'before' | 'after'
    hooks: any
    prismaClient: PrismaClient
    QueryParams: QueryParams
    result?: any | any[]
}): Promise<void | any> {
    const matchingHooks = Object.keys(hooks).filter((hookPath: string) => {
        const hookParts = hookPath.split(':')
        const hookWhen = hookParts[0]
        const hookGlob = hookParts[1]
        const currentPath = QueryParams.operation

        return hookWhen === when && isMatchingGlob(currentPath, hookGlob)
    })

    if (matchingHooks.length > 0) {
        for (let index = 0; index < matchingHooks.length; index++) {
            const hookPath = matchingHooks[index]

            if (Object.prototype.hasOwnProperty.call(hooks, hookPath)) {
                const hookResult = await hooks[hookPath]({
                    ...QueryParams,
                    ...(typeof result !== 'undefined' && when === 'after' && { result }),
                    prismaClient,
                })
                result = hookResult
            }
        }
    }

    return result
}
