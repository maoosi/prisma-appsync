import { clone, decode, dotate, encode, filterXSS, isEmpty, isMatchingGlob, isUndefined, lowerFirst, merge, replaceAll, walk } from './utils';
export { PrismaAppSync } from './core';
export { CustomError, log } from './inspector';
export { queryBuilder } from './resolver';
export { QueryParams, QueryParamsCustom, BeforeHookParams, AfterHookParams, Authorization, AppSyncEvent, Identity, API_KEY, AWS_IAM, AMAZON_COGNITO_USER_POOLS, AWS_LAMBDA, OPENID_CONNECT, AppSyncResolverHandler, AppSyncResolverEvent, AppSyncIdentity, } from './types';
export { Authorizations } from './consts';
declare const _: {
    merge: typeof merge;
    clone: typeof clone;
    decode: typeof decode;
    encode: typeof encode;
    dotate: typeof dotate;
    isMatchingGlob: typeof isMatchingGlob;
    filterXSS: typeof filterXSS;
    isEmpty: typeof isEmpty;
    isUndefined: typeof isUndefined;
    lowerFirst: typeof lowerFirst;
    isObject: (val: any) => val is object;
    walk: typeof walk;
    replaceAll: typeof replaceAll;
};
export { _ };
