import { merge, replaceAll, uniq } from '@client/utils'
import type { DMMF } from '@prisma/generator-helper'

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

export function parseDirectives(modelDMMF: DMMF.Model, doc: string): Directives {
    let gql: DirectiveGql = {}
    let auth: DirectiveAuth = {}

    const gqlRegex = /@(?:gql)\(([^)]+)\)/gm
    const authRegex = /@(?:auth)\(([^)]+)\)/gm

    const find = ['apiKey', 'userPools', 'iam', 'oidc']
    const replace = ['"apiKey"', '"userPools"', '"iam"', '"oidc"']

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
            return getGQLDirectives(modelDMMF, action, { gql, auth })
        },
        canOutputGQL: (action: Action) => {
            return canOutputGQL(modelDMMF, action, { gql, auth })
        },
    }
}

function canOutputGQL(
    modelDMMF: DMMF.Model,
    action: Action,
    directives: {
        gql: DirectiveGql
        auth: DirectiveAuth
    },
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

function getGQLDirectives(
    modelDMMF: DMMF.Model,
    action: Action | 'model',
    directives: {
        gql: DirectiveGql
        auth: DirectiveAuth
    },
): string[] {
    const actionGroup = actionsMapping?.[action]

    let authDirectives: Authz[] = []

    if (action !== 'model' && directives.auth?.[actionGroup]?.[action])
        authDirectives = directives.auth[actionGroup]?.[action] as Authz[]

    else if (action !== 'model' && directives.auth?.[actionGroup] && Array.isArray(directives.auth?.[actionGroup]))
        authDirectives = directives.auth?.[actionGroup] as unknown as Authz[]

    else if (directives.auth?.model && Array.isArray(directives.auth?.model))
        authDirectives = directives.auth?.model as Authz[]

    const appSyncDirectives: string[] = []

    authDirectives.forEach((authDirective) => {
        if (authDirective?.allow === 'apiKey') {
            appSyncDirectives.push('@aws_api_key')
        }
        else if (authDirective?.allow === 'iam') {
            appSyncDirectives.push('@aws_iam')
        }
        else if (authDirective?.allow === 'oidc') {
            appSyncDirectives.push('@aws_oidc')
        }
        else if (authDirective?.allow === 'userPools') {
            // You can’t use the @aws_auth directive along with additional authorization modes. @aws_auth works only in the context of AMAZON_COGNITO_USER_POOLS authorization with no additional authorization modes.
            // https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
            const cognitoDirective = authDirectives.some(d => d.allow !== 'userPools')
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

    // console.log('\n', JSON.stringify({ model: modelDMMF.name, action, directives, authDirectives, appSyncDirectives: uniq(appSyncDirectives) }, null, 2))

    return uniq(appSyncDirectives)
}

export type Action = 'get' | 'list' | 'count' | 'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany' | 'onCreated' | 'onUpdated' | 'onUpserted' | 'onDeleted' | 'onMutated' | 'onCreatedMany' | 'onUpdatedMany' | 'onMutatedMany' | 'onDeletedMany'

export type Directives = {
    gql: DirectiveGql
    auth: DirectiveAuth
    getGQLDirectives: (action: Action | 'model') => string[]
    canOutputGQL: (action: Action) => boolean
}

type Authz = {
    allow: 'apiKey' | 'iam' | 'oidc' | 'userPools'
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
