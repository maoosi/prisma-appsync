import { Shield, Subject, ShieldDirectiveParam, ShieldDirectivePossibleTypes } from './defs'


export function sanitize() {

}

export function getApplicableRules(beforeConfig, resolverQuery) {
    const applicableRules = []

    applicableRules.forEach((rule:any) => {
        resolverQuery.paths.forEach((path:string) => {
            const isMatch = path

            if (isMatch) {
                applicableRules.push({ shield: null, reason: null, run: () => {} })
            }
        })
    })

    return applicableRules
}

export function getPrismaQueryObject(applicableRules:any[]) {

}

export function canAccess(applicableRules:any[]) {
    return applicableRules.findIndex((rule:any) => {
        return typeof rule.shield === 'boolean' && rule.shield === false
    }) < 0
}