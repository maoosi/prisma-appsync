import { merge, replaceAll, uniq, uniqBy } from '@client/utils'
import type { DMMF } from '@prisma/generator-helper'

const authzModes = ['apiKey', 'userPools', 'iam', 'oidc', 'lambda']

const actionsMapping = {
    // queries
    get: 'queries',
    list: 'queries',
    count: 'queries',

    // mutations
    create: 'mutations',
    createMany: 'mutations',
    update: 'mutations',
    updateMany: 'mutations',
    upsert: 'mutations',
    delete: 'mutations',
    deleteMany: 'mutations',

    // subscriptions
    onCreated: 'subscriptions',
    onUpdated: 'subscriptions',
    onUpserted: 'subscriptions',
    onDeleted: 'subscriptions',
    onMutated: 'subscriptions',
    onCreatedMany: 'subscriptions',
    onUpdatedMany: 'subscriptions',
    onMutatedMany: 'subscriptions',
    onDeletedMany: 'subscriptions',
} as const

export function parseSchemaAuthzModes(datamodel: DMMF.Datamodel, opts?: { defaultDirective?: string }): string[] {
    const schemaDirectives = datamodel?.models
        ?.map(modelDMMF => [opts?.defaultDirective, modelDMMF.documentation].filter(Boolean).join(' '))
        ?.join(' ') || ''

    const regex = new RegExp(`(${authzModes.join('|')})`, 'gm')
    const found = schemaDirectives.match(regex)
    const uniqAuthzModes = found ? uniq(found) : []

    return uniqAuthzModes
}

export function parseDirectives(
    { modelDMMF, defaultDirective, schemaAuthzModes }:
    { modelDMMF: DMMF.Model; defaultDirective: string; schemaAuthzModes: string[] },
): Directives {
    const doc = [defaultDirective, modelDMMF.documentation].filter(Boolean).join('\n')

    let gql: DirectiveGql = {}
    let auth: DirectiveAuth = {}

    const gqlRegex = /@(?:gql)\(([^)]+)\)/gm
    const authRegex = /@(?:auth)\(([^)]+)\)/gm

    const find = authzModes
    const replace = authzModes.map(authzMode => `"${authzMode}"`)
    const gqlDirectives = doc.match(gqlRegex)

    if (gqlDirectives) {
        for (let i = 0; i < gqlDirectives.length; i++) {
            const str = replaceAll(gqlDirectives[i].replace(gqlRegex, '$1'), find, replace)
            // eslint-disable-next-line no-new-func
            gql = merge(gql, new Function(`return ({${str}})`)())
        }
    }

    const authDirectives = doc.match(authRegex)

    if (authDirectives) {
        for (let j = 0; j < authDirectives.length; j++) {
            const str = replaceAll(authDirectives[j].replace(authRegex, '$1'), find, replace)
            // eslint-disable-next-line no-new-func
            auth = merge(auth, new Function(`return ({${str}})`)())
        }
    }

    return {
        auth,
        gql,
        getGQLDirectives: (action: Action | 'model') => {
            return getGQLDirectives({ modelDMMF, action, directives: { gql, auth }, schemaAuthzModes })
        },
        canOutputGQL: (action: Action) => {
            return canOutputGQL({ modelDMMF, action, directives: { gql, auth }, schemaAuthzModes })
        },
    }
}

function canOutputGQL(
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

    const actionGroup = actionsMapping?.[action]

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

function getAuthzDirectives(
    { action, directives }: DirectiveHelperFunc,
): Authz[] {
    let authDirectives: Authz[] = []

    if (action === 'model') {
        // model
        if (directives.auth?.model && Array.isArray(directives.auth?.model))
            authDirectives = [...authDirectives, ...directives.auth?.model as Authz[]]

        // queries, mutation, etc..
        ;['queries', 'mutations', 'subscriptions'].forEach((thisActionGroup) => {
            if (Array.isArray(directives.auth?.[thisActionGroup])) {
                authDirectives = [
                    ...authDirectives,
                    ...directives.auth?.[thisActionGroup] as unknown as Authz[],
                ]
            }
        })

        // get, list, count, create, etc..
        ;[
            // queries
            'get', 'list', 'count',
            // mutations
            'create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany',
            // subscriptions
            'onCreated', 'onUpdated', 'onUpserted', 'onDeleted', 'onMutated', 'onCreatedMany', 'onUpdatedMany', 'onDeletedMany', 'onMutatedMany',
        ].forEach((thisAction) => {
            const thisActionGroup = actionsMapping?.[thisAction]

            if (Array.isArray(directives.auth?.[thisActionGroup]?.[thisAction])) {
                authDirectives = [
                    ...authDirectives,
                    ...directives.auth[thisActionGroup]?.[thisAction] as Authz[],
                ]
            }
        })
    }
    else {
        const actionGroup = actionsMapping?.[action]

        // model
        if (Array.isArray(directives.auth?.model))
            authDirectives = [...authDirectives, ...directives.auth?.model as Authz[]]

        // queries, mutation, etc..
        if (Array.isArray(directives.auth?.[actionGroup]))
            authDirectives = [...authDirectives, ...directives.auth?.[actionGroup] as unknown as Authz[]]

        // get, list, count, create, etc..
        if (Array.isArray(directives.auth?.[actionGroup]?.[action]))
            authDirectives = [...authDirectives, ...directives.auth[actionGroup]?.[action] as Authz[]]
    }

    return mergePrismaAuthDirectives(authDirectives)
}

function mergePrismaAuthDirectives(authDirectives: Authz[]): Authz[] {
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
    canOutputGQL: (action: Action) => boolean
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
