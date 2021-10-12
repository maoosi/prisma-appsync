import { ShieldAuthorization, Shield, Context } from './defs'
import { merge, clone, encode, filterXSS, isMatchingGlob } from './utils'

/**
 * #### Sanitize data inside object (parse xss + encode html).
 *
 * @param {any} data
 * @returns any
 */
export function sanitize(data: any): any {
    const outputData = clone(data)

    for (const prop in outputData) {
        if (Object.prototype.hasOwnProperty.call(outputData, prop)) {
            const value = outputData[prop]

            if (typeof value === 'string') {
                outputData[prop] = encode(filterXSS(value))
            } else if (
                typeof value === 'object' &&
                !Array.isArray(value) &&
                typeof value !== 'function' &&
                value !== null
            ) {
                outputData[prop] = this.sanitize(value)
            }
        }
    }

    return outputData
}

/**
 * #### Returns an authorization object from a Shield configuration passed as input.
 *
 * @param {any} options
 * @param {Shield} options.shield
 * @param {string[]} options.paths
 * @returns ShieldAuthorization
 */
export function getShieldAuthorization({ shield, paths }: { shield: Shield; paths: string[] }): ShieldAuthorization {
    const authorization: ShieldAuthorization = {
        canAccess: true,
        reason: String(),
        prismaFilter: {},
        matcher: String(),
    }

    for (let i = paths.length - 1; i >= 0; i--) {
        const path: string = paths[i]

        for (const globPattern in shield) {
            if (isMatchingGlob(path, globPattern)) {
                const shieldRule = shield[globPattern]

                if (typeof shieldRule === 'boolean') {
                    authorization.canAccess = shield[globPattern] as boolean
                } else {
                    if (typeof shieldRule.rule === 'undefined') {
                        // Badly formed shield rule
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

                authorization.matcher = globPattern
                authorization.reason =
                    typeof shieldRule !== 'boolean' && typeof shieldRule.reason !== 'undefined'
                        ? shieldRule.reason
                        : `Matcher: ${authorization.matcher}`
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
