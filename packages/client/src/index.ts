import { queryBuilder } from './resolver'
import {
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
    traverse,
    traverseAsync,
    replaceAll,
} from './utils'

export { PrismaAppSync } from './core'
export { CustomError, log } from './inspector'
export {
    QueryParams,
    QueryParamsCustom,
    BeforeHookParams,
    AfterHookParams,
    Authorizations,
    Authorization,
    AppsyncEvent,
    Identity,
    API_KEY,
    AWS_IAM,
    AMAZON_COGNITO_USER_POOLS,
    AWS_LAMBDA,
    OPENID_CONNECT,
} from './defs'

const Helpers = {
    queryBuilder,
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
    traverse,
    traverseAsync,
    replaceAll,
}

export { Helpers }
