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
    replaceAll,
} from './utils'

export { PrismaAppSync } from './core'
export { CustomError } from './inspector'
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
    replaceAll,
}

export { Helpers }
