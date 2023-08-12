import {
    clone,
    decode,
    dotate,
    encode,
    filterXSS,
    isEmpty,
    isMatchingGlob,
    isObject,
    isUndefined,
    lowerFirst,
    merge,
    replaceAll,
    walk,
} from './utils'

export { PrismaAppSync } from './core'
export { CustomError, log } from './inspector'
export { queryBuilder } from './resolver'
export {
    QueryParams,
    QueryParamsCustom,
    BeforeHookParams,
    AfterHookParams,
    Authorization,
    AppSyncEvent,
    Identity,
    API_KEY,
    AWS_IAM,
    AMAZON_COGNITO_USER_POOLS,
    AWS_LAMBDA,
    OPENID_CONNECT,
    AppSyncResolverHandler,
    AppSyncResolverEvent,
    AppSyncIdentity,
} from './types'
export { Authorizations } from './consts'

const _ = {
    merge,
    clone,
    decode,
    encode,
    dotate,
    isMatchingGlob,
    filterXSS,
    isEmpty,
    isUndefined,
    lowerFirst,
    isObject,
    walk,
    replaceAll,
}

export { _ }
