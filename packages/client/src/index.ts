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
    traverseNodes,
} from './utils'

export { PrismaAppSync } from './core'
export { CustomError, log } from './inspector'
export { queryBuilder } from './resolver'
export {
    QueryParams,
    QueryParamsCustom,
    BeforeHookParams,
    AfterHookParams,
    Authorizations,
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
} from './defs'

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
    traverseNodes,
    replaceAll,
}

export { _ }
