import { graphQlQueryToJson } from 'graphql-query-to-json'
import { dot } from 'dot-object'


export function mockAppSyncPayload({ request, graphQLParams, mockIdentity }: {
    request: any,
    graphQLParams: { query: string, variables: any, operationName: string, raw: any },
    mockIdentity?: typeof identities[keyof typeof identities],
}): $response {
    const selectionSetGraphQL = graphQLParams.query
    const variables = graphQLParams.variables
    const fieldName = graphQLParams.operationName
    const headers = request?.headers || {}

    const query:any = graphQlQueryToJson(selectionSetGraphQL, {
        ...(variables && { variables })
    })

    const parentType:string = Object.keys(query)[0]
    const parentTypeName = parentType.charAt(0).toUpperCase() + parentType.slice(1)
    const operation = isBatchInvokation(fieldName) ? 'BatchInvoke' : 'Invoke'
    const resolverContext = {}
    const selectionSet = query[parentType][fieldName]
    const args = typeof selectionSet.__args !== 'undefined'
        ? selectionSet.__args
        : {}

    if (Object.keys(args).length > 0) {
        delete(selectionSet.__args)
    }

    const selectionSetList = Object.keys(dot(selectionSet))
        .map(selection => selection.replace(/\./g, '/'))

    selectionSetList.unshift('__typename')

    const sourceIp = headers['x-forwarded-for'] || request?.socket?.remoteAddress
    const username = 'johndoe'
    const sub = 'xxxxxx'

    const identity = (mockIdentity && typeof identities[mockIdentity] !== 'undefined')
        ? mockIdentities[mockIdentity]({ username, sub, sourceIp, resolverContext })
        : mockIdentities[identities.API_KEY]({ username, sub, sourceIp, resolverContext })

    const response:$response = {
        version: '2018-05-29',
        operation: operation,
        payload: {
            arguments: args,
            source: null,
            identity,
            info: {
                parentTypeName,
                fieldName,
                variables,
                selectionSetList,
                selectionSetGraphQL
            },
            request: {},
            prev: { result: null },
            stash: null
        },
    }

    // console.dir(response, { depth: null })

    response.payload.request = request

    return response
}


function isBatchInvokation(query: string): boolean {
    return  query.startsWith('list') ||
            query.startsWith('count') ||
            query.startsWith('createMany') ||
            query.startsWith('updateMany') ||
            query.startsWith('deleteMany') ||
            query.startsWith('onCreatedMany') ||
            query.startsWith('onUpdatedMany') ||
            query.startsWith('onDeletedMany') ||
            query.startsWith('onMutatedMany')
}

const identities = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS',
    AWS_LAMBDA: 'AWS_LAMBDA',
    AWS_OIDC: 'AWS_OIDC'
} as const

type mockOptions = {
    sub: string, 
    username: string, 
    sourceIp: string,
    resolverContext: $resolverContext
}

const mockIdentities = {
    [identities.API_KEY]: (opts:mockOptions):$identity => {
        return null
    },
    [identities.AWS_LAMBDA]: (opts:mockOptions):$identity => {
        return { resolverContext: opts.resolverContext }
    },
    [identities.AWS_IAM]: (opts:mockOptions):$identity => {
        return {
            accountId: "string",
            cognitoIdentityPoolId: "string",
            cognitoIdentityId: "string",
            sourceIp: [opts.sourceIp],
            username: opts.username,
            userArn: "string",
            cognitoIdentityAuthType: "string",
            cognitoIdentityAuthProvider: "string"
        }
    },
    [identities.AMAZON_COGNITO_USER_POOLS]: (opts:mockOptions):$identity => {
        return {
            sub: opts.sub,
            issuer: "string",
            username: opts.username,
            claims: {},
            sourceIp: [opts.sourceIp],
            defaultAuthStrategy: "string",
            groups: ['admin', 'member'],
        }
    },
    [identities.AWS_OIDC]: (opts:mockOptions):$identity => {
        return {
            claims: {
                sub: opts.sub,
                aud: "string",
                azp: "string",
                iss: "string",
                exp: 1630923679,
                iat: 1630837279,
                gty: "string"
            },
            sourceIp: [opts.sourceIp],
            issuer: "string",
            sub: opts.sub,
        }
    }
}


type $info = {
    fieldName: string
    parentTypeName: string
    variables: any
    selectionSetList: string[]
    selectionSetGraphQL: string
}

type $context = {
    arguments: any
    source: any
    identity: $identity
    request: any
    info: $info
    prev: {
        result: any
    }
    stash: any
}

type $response = {
    version: '2018-05-29'
    operation: 'Invoke' | 'BatchInvoke'
    payload: $context
}

type $resolverContext = any

type $identity = {
    accountId: string
    cognitoIdentityPoolId: string
    cognitoIdentityId: string
    sourceIp: string[]
    username: string
    userArn: string
    cognitoIdentityAuthType: string
    cognitoIdentityAuthProvider: string
} | {
    sub: string
    issuer: string
    username: string
    claims: any
    sourceIp: string[]
    defaultAuthStrategy: string
    groups: string[]
} | {
    claims: {
        sub: string
        aud: string
        azp: string
        iss: string
        exp: number
        iat: number
        gty: string
    },
    sourceIp: string[]
    issuer: string
    sub: string
} | {
    resolverContext: $resolverContext
} | null
