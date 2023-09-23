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
): ModelDirectives {
    const doc = [defaultDirective, modelDMMF.documentation].filter(Boolean).join('\n')

    const gqlRegex = /@(?:gql)\(([^)]+)\)/gm
    const authRegex = /@(?:auth)\(([^)]+)\)/gm

    const find = AuthzModes
    const replace = AuthzModes.map(authzMode => `"${authzMode}"`)

    const gql: DirectiveGql = parseDocumentationMatches(gqlRegex, doc, find, replace)
    const auth: DirectiveAuth = parseDocumentationMatches(authRegex, doc, find, replace)

    const directives = { gql, auth }

    return {
        auth,
        gql,
        getGQLDirectivesForAction: (action: Action) => {
            const authzDirectives = getAuthzDirectivesForAction(action, directives)
            return convertToGQLDirectives(authzDirectives, schemaAuthzModes)
        },
        getGQLDirectivesForField: (field: string) => {
            const authzDirectives = getAuthzDirectivesForField(field, directives)
            return convertToGQLDirectives(authzDirectives, schemaAuthzModes)
        },
        getGQLDirectivesForModel: () => {
            const authzDirectives = getAuthzDirectivesForModel(directives)
            return convertToGQLDirectives(authzDirectives, schemaAuthzModes)
        },
        isFieldEligibleForGQL: (field: string) => {
            return isFieldEligibleForGQL({ field, directives })
        },
        isActionEligibleForGQL: (action: Action) => {
            return isActionEligibleForGQL({ action, directives })
        },
    }
}

function accessNestedProperty(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

function isDirectiveDefined(directive, ...properties) {
    return properties.every(p => accessNestedProperty(directive, p) !== null)
}

function isActionEligibleForGQL(
    { action, directives }: { action: Action; directives: Directives },
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

    if (actionGroup === 'queries')
        can = isDirectiveDefined(directives?.gql, 'model', 'queries', `queries.${action}`)

    else if (actionGroup === 'mutations' && action === 'upsert')
        can = isDirectiveDefined(directives?.gql, 'model', 'mutations', `mutations.${action}`, 'mutations.create', 'mutations.update')

    else if (actionGroup === 'mutations')
        can = isDirectiveDefined(directives?.gql, 'model', 'mutations', `mutations.${action}`)

    else if (actionGroup === 'subscriptions')
        can = isDirectiveDefined(directives?.gql, 'model', 'subscriptions', 'mutations', `subscriptions.${action}`)

    return can
}

function isFieldEligibleForGQL(
    { field, directives }: { field: string; directives: Directives },
): boolean {
    return isDirectiveDefined(directives?.gql, `fields.${field}`)
}

function mergeIfArray(target, source) {
    if (Array.isArray(source))
        return [...target, ...source]

    return target
}

function getAuthzDirectivesForModel(directives) {
    let authDirectives: Authz[] = []

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

    return combineUniqueAuthDirectives(authDirectives)
}

function getAuthzDirectivesForAction(action, directives) {
    let authDirectives: Authz[] = []

    const actionGroup = getActionType(action)

    // model
    authDirectives = mergeIfArray(authDirectives, directives.auth?.model)

    // queries, mutation, etc..
    authDirectives = mergeIfArray(authDirectives, directives.auth?.[actionGroup])

    // get, list, count, create, etc..
    authDirectives = mergeIfArray(authDirectives, directives.auth?.[actionGroup]?.[action])

    return combineUniqueAuthDirectives(authDirectives)
}

function getAuthzDirectivesForField(field, directives) {
    return combineUniqueAuthDirectives(
        mergeIfArray([], directives.auth?.fields?.[field]),
    )
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

export type Action = 'get' | 'list' | 'count' | 'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany' | 'onCreated' | 'onUpdated' | 'onUpserted' | 'onDeleted' | 'onMutated' | 'onCreatedMany' | 'onUpdatedMany' | 'onMutatedMany' | 'onDeletedMany'

export type Directives = {
    gql: DirectiveGql
    auth: DirectiveAuth
}

export type ModelDirectives = {
    gql: DirectiveGql
    auth: DirectiveAuth
    getGQLDirectivesForAction: (action: Action) => string[]
    getGQLDirectivesForField: (field: string) => string[]
    getGQLDirectivesForModel: () => string[]
    isActionEligibleForGQL: (action: Action) => boolean
    isFieldEligibleForGQL: (field: string) => boolean
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
