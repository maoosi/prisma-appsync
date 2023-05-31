import useLambdaIdentity from '@appsync-server/utils/useLambdaIdentity'
import { Authorizations } from '@client'
import { describe, expect, it } from 'vitest'

const toBase64 = (str: string) => Buffer.from(str).toString('base64')

describe('Server | Utils', () => {
    describe('#useLambdaIdentity', () => {
        describe('when the identity equals to AMAZON_COGNITO_USER_POOLS', () => {
            it('should extract data from JWT token', () => {
                const header = {
                    alg: 'RS256',
                }
                const data = {
                    'sub': 'sub',
                    'email_verified': true,
                    'iss': 'https://cognito-idp.us-east-1.amazonaws.com/user_pool_id',
                    'cognito:username': 'username',
                    'origin_jti': 'origin_jti',
                    'custom:variable': 'custom variable',
                    'aud': 'aud',
                    'event_id': 'event_id',
                    'token_use': 'id',
                    'auth_time': 1683789834,
                    'exp': 1684737597,
                    'iat': 1684733997,
                    'jti': 'jti',
                    'email': 'user@example.com',
                }
                const token = `${toBase64(JSON.stringify(header))}.${toBase64(JSON.stringify(data))}.fakesignature`

                expect(useLambdaIdentity(Authorizations.AMAZON_COGNITO_USER_POOLS, {
                    jwt: token,
                    sub: 'mockSub',
                    sourceIp: 'sourceId',
                    username: 'mockUsername',
                    resolverContext: {},
                })).toEqual({
                    sub: data.sub,
                    issuer: 'string',
                    username: data['cognito:username'],
                    claims: data,
                    sourceIp: ['sourceId'],
                    defaultAuthStrategy: 'string',
                    groups: ['admin', 'member'],
                })
            })
        })
    })
})
