import { ShieldAuthorization, Shield } from './defs'
import { merge, clone, decode, filterXSS, isMatchingGlob } from './utils'

// TODO: Comment code

export function sanitize(data: object): object {
    const outputData = clone(data)

    for (const prop in outputData) {
        if (Object.prototype.hasOwnProperty.call(outputData, prop)) {
            const value = outputData[prop]

            if (typeof value === 'string') {
                outputData[prop] = decode(filterXSS(value))
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

export function getAuthorization({ shield, paths }: { shield: Shield; paths: string[] }): ShieldAuthorization {
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

export function getDepth({ paths }: { paths: string[] }): number {
    let depth = 0

    paths.forEach((path: string) => {
        const pathDepth = path.split('/').length - 3
        if (pathDepth > depth) depth = pathDepth
    })

    return depth
}
