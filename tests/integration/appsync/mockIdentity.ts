import {
    Identity,
    Authorizations,
    Authorization,
    API_KEY,
    AWS_IAM,
    AMAZON_COGNITO_USER_POOLS,
    AWS_LAMBDA,
    OPENID_CONNECT,
} from '../../../src/client/defs'

export default function (identity: Authorization, opts: mockOptions): Identity {
    if (identity === Authorizations.AWS_IAM) {
        const mock: AWS_IAM = {
            accountId: 'string',
            cognitoIdentityPoolId: 'string',
            cognitoIdentityId: 'string',
            sourceIp: [opts.sourceIp],
            username: opts.username,
            userArn: 'string',
            cognitoIdentityAuthType: 'string',
            cognitoIdentityAuthProvider: 'string',
        }
        return mock
    } else if (identity === Authorizations.AMAZON_COGNITO_USER_POOLS) {
        const mock: AMAZON_COGNITO_USER_POOLS = {
            sub: opts.sub,
            issuer: 'string',
            username: opts.username,
            claims: {},
            sourceIp: [opts.sourceIp],
            defaultAuthStrategy: 'string',
            groups: ['admin', 'member'],
        }
        return mock
    } else if (identity === Authorizations.AWS_LAMBDA) {
        const mock: AWS_LAMBDA = {
            resolverContext: opts.resolverContext,
        }
        return mock
    } else if (identity === Authorizations.OPENID_CONNECT) {
        const mock: OPENID_CONNECT = {
            claims: {
                sub: opts.sub,
                aud: 'string',
                azp: 'string',
                iss: 'string',
                exp: 1630923679,
                iat: 1630837279,
                gty: 'string',
            },
            sourceIp: [opts.sourceIp],
            issuer: 'string',
            sub: opts.sub,
        }
        return mock
    } else {
        const mock: API_KEY = null
        return mock
    }
}

type mockOptions = {
    sub: string
    username: string
    sourceIp: string
    resolverContext: any
}
