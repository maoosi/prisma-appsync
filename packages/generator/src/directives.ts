import { merge, replaceAll, uniq, uniqBy } from '@client/utils'
import type { DMMF } from '@prisma/generator-helper'

const AuthzModes = ['apiKey', 'userPools', 'iam', 'oidc', 'lambda']
const QueryActions = ['get', 'list', 'count']
const MutationActions = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']
const SubscriptionActions = ['onCreated', 'onUpdated', 'onUpserted', 'onDeleted', 'onMutated', 'onCreatedMany', 'onUpdatedMany', 'onDeletedMany', 'onMutatedMany']
const Actions = [...QueryActions, ...MutationActions, ...SubscriptionActions]

function getActionType(action) {
    if (QueryActions.includes(action))
        return 'queries'
    if (MutationActions.includes(action))
        return 'mutations'
    if (SubscriptionActions.includes(action))
        return 'subscriptions'
    else
        return 'model'
}

export function extractUniqueAuthzModes(
    datamodel: DMMF.Datamodel, opts?: { defaultDirective?: string },
): string[] {
    const schemaDirectives = datamodel?.models
        ?.map(modelDMMF => [opts?.defaultDirective, modelDMMF.documentation].filter(Boolean).join(' '))
        ?.join(' ') || ''
    const regex = new RegExp(`(${AuthzModes.join('|')})`, 'gm')
    const found = schemaDirectives.match(regex)
    const uniqAuthzModes = found ? uniq(found) : []

    return uniqAuthzModes
}

function parseDocumentationMatches(regex, doc, find, replace) {
    let directive = {}

    const matches = doc.match(regex)

    if (matches) {
        for (let i = 0; i < matches.length; i++) {
            const str = replaceAll(matches[i].replace(regex, '$1'), find, replace)
            // eslint-disable-next-line no-new-func
            directive = merge(directive, new Function(`return ({${str}})`)())
        }
    }

    return directive
}

export function parseModelDirectives(
    { modelDMMF, defaultDirective, schemaAuthzModes }:
    { modelDMMF: DMMF.Model; defaultDirective: string; schemaAuthzModes: string[] },
): Directives {
    const doc = [defaultDirective, modelDMMF.documentation].filter(Boolean).join('\n')

    const gqlRegex = /@(?:gql)\(([^)]+)\)/gm
    const authRegex = /@(?:auth)\(([^)]+)\)/gm

    const find = AuthzModes
    const replace = AuthzModes.map(authzMode => `"${authzMode}"`)

    const gql: DirectiveGql = parseDocumentationMatches(gqlRegex, doc, find, replace)
    const auth: DirectiveAuth = parseDocumentationMatches(authRegex, doc, find, replace)

    return {
        auth,
        gql,
        getGQLDirectives: (action: Action | 'model') => {
            return getGQLDirectives({ modelDMMF, action, directives: { gql, auth }, schemaAuthzModes })
        },
        isActionEligibleForGQL: (action: Action) => {
            return isActionEligibleForGQL({ modelDMMF, action, directives: { gql, auth }, schemaAuthzModes })
        },
    }
}

function isActionEligibleForGQL(
    { action, directives }: DirectiveHelperFunc,
): boolean {
    let can = false

    /**
     * Cascading rules:
     *
     *  - Disabling model [cascade] on all queries, mutations and subscriptions
     *  - Disabling queries, mutations, or subscription [cascade] on all related operations
     *  - Disabling update [cascade] on upsert
     *  - Disabling create [cascade] on upsert
     *  - Disabling mutations [cascade] on subscriptions
     */

    const actionGroup = getActionType(action)

    if (actionGroup === 'queries') {
        can = !(directives?.gql?.model === null || directives?.gql?.queries === null) && !(directives?.gql?.queries?.[action] === null)
    }
    else if (actionGroup === 'mutations' && action === 'upsert') {
        can = !(directives?.gql?.model === null || directives?.gql?.mutations === null) && !(directives?.gql?.mutations?.[action] === null) && !(directives?.gql?.mutations?.create === null) && !(directives?.gql?.mutations?.update === null)
    }
    else if (actionGroup === 'mutations') {
        can = !(directives?.gql?.model === null || directives?.gql?.mutations === null) && !(directives?.gql?.mutations?.[action] === null)
    }
    else if (actionGroup === 'subscriptions') {
        can = !(
            directives?.gql?.model === null
            || directives?.gql?.subscriptions === null
            || directives?.gql?.mutations === null
        ) && !(directives?.gql?.subscriptions?.[action] === null)
    }

    return can
}

function mergeIfArray(target, source) {
    if (Array.isArray(source))
        return [...target, ...source]

    return target
}

function getAuthzDirectives(
    { action, directives }: DirectiveHelperFunc,
): Authz[] {
    let authDirectives: Authz[] = []

    if (action === 'model') {
        // model
        authDirectives = mergeIfArray(authDirectives, directives.auth?.model)

        // queries, mutation, etc..
        ;['queries', 'mutations', 'subscriptions'].forEach((thisActionGroup) => {
            authDirectives = mergeIfArray(authDirectives, directives.auth?.[thisActionGroup])
        })

        // get, list, count, create, etc..
        Actions.forEach((thisAction) => {
            const thisActionGroup = getActionType(thisAction)
            authDirectives = mergeIfArray(authDirectives, directives.auth?.[thisActionGroup]?.[thisAction])
        })
    }
    else {
        const actionGroup = getActionType(action)

        // model
        authDirectives = mergeIfArray(authDirectives, directives.auth?.model)

        // queries, mutation, etc..
        authDirectives = mergeIfArray(authDirectives, directives.auth?.[actionGroup])

        // get, list, count, create, etc..
        authDirectives = mergeIfArray(authDirectives, directives.auth?.[actionGroup]?.[action])
    }

    return combineUniqueAuthDirectives(authDirectives)
}

function combineUniqueAuthDirectives(authDirectives: Authz[]): Authz[] {
    return uniqBy(
        Array.from(
            authDirectives
                .reduce((map, policy) => {
                    const existingPolicy = map.get(policy.allow)
                    if (existingPolicy && policy.groups) {
                        // merge groups
                        existingPolicy.groups = [...existingPolicy.groups ?? [], ...policy.groups]
                    }
                    else {
                        map.set(policy.allow, { ...policy })
                    }
                    return map
                }, new Map()).values(),
        ), 'allow',
    )
}

function convertToGQLDirectives(prismaAuthDirectives, schemaAuthzModes) {
    const appSyncDirectives: string[] = []

    prismaAuthDirectives.forEach((authDirective) => {
        if (authDirective?.allow === 'apiKey') {
            appSyncDirectives.push('@aws_api_key')
        }
        else if (authDirective?.allow === 'iam') {
            appSyncDirectives.push('@aws_iam')
        }
        else if (authDirective?.allow === 'oidc') {
            appSyncDirectives.push('@aws_oidc')
        }
        else if (authDirective?.allow === 'lambda') {
            appSyncDirectives.push('@aws_lambda')
        }
        else if (authDirective?.allow === 'userPools') {
            // You can’t use the @aws_auth directive along with additional authorization modes. @aws_auth works only in the context of AMAZON_COGNITO_USER_POOLS authorization with no additional authorization modes.
            // https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
            const cognitoDirective = schemaAuthzModes.length > 1
                ? '@aws_cognito_user_pools'
                : '@aws_auth'

            if (authDirective?.groups && Array.isArray(authDirective.groups)) {
                appSyncDirectives.push(
                    `${cognitoDirective}(cognito_groups: [${authDirective.groups.map((g: string) => `"${g}"`).join(', ')}])`,
                )
            }
            else {
                appSyncDirectives.push(cognitoDirective)
            }
        }
    })

    return uniq(appSyncDirectives)
}

function getGQLDirectives(
    { action, directives, schemaAuthzModes, modelDMMF }: DirectiveHelperFunc,
): string[] {
    return convertToGQLDirectives(
        getAuthzDirectives({ action, directives, schemaAuthzModes, modelDMMF }),
        schemaAuthzModes,
    )
}

export type Action = 'get' | 'list' | 'count' | 'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany' | 'onCreated' | 'onUpdated' | 'onUpserted' | 'onDeleted' | 'onMutated' | 'onCreatedMany' | 'onUpdatedMany' | 'onMutatedMany' | 'onDeletedMany'

export type Directives = {
    gql: DirectiveGql
    auth: DirectiveAuth
    getGQLDirectives: (action: Action | 'model') => string[]
    isActionEligibleForGQL: (action: Action) => boolean
}

type Authz = {
    allow: 'apiKey' | 'iam' | 'oidc' | 'userPools' | 'lambda'
    groups?: string[]
}

type DirectiveGql = {
    fields?: Record<string, null>
    model?: null
    queries?: null | Record<'get' | 'list' | 'count', string | null>
    mutations?: null | Record<'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany', string | null>
    subscriptions?: null | Record<'onCreated' | 'onUpdated' | 'onUpserted' | 'onDeleted' | 'onMutated' | 'onCreatedMany' | 'onUpdatedMany' | 'onMutatedMany' | 'onDeletedMany', string | null>
    scalars?: Record<string, string>
}

type DirectiveAuth = {
    model?: Authz[]
    fields?: Record<string, Authz[]>
    queries?: Record<'get' | 'list' | 'count', Authz[]>
    mutations?: Record<'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany', Authz[]>
    subscriptions?: Record<'onCreated' | 'onUpdated' | 'onUpserted' | 'onDeleted' | 'onMutated' | 'onCreatedMany' | 'onUpdatedMany' | 'onMutatedMany' | 'onDeletedMany', Authz[]>
}

type DirectiveHelperFunc = {
    modelDMMF: DMMF.Model
    action: Action | 'model'
    directives: {
        gql: DirectiveGql
        auth: DirectiveAuth
    }
    schemaAuthzModes: string[]
}
