import type { Context, PrismaClient, QueryParams, Shield, ShieldAuthorization } from './types';
/**
 * #### Sanitize data (parse xss + encode html).
 *
 * @param {any} data
 * @returns any
 */
export declare function sanitize(data: any): Promise<any>;
/**
 * #### Clarify data (decode html).
 *
 * @param {any} data
 * @returns any
 */
export declare function clarify(data: any): Promise<any>;
/**
 * #### Returns an authorization object from a Shield configuration passed as input.
 *
 * @param {Shield} options.shield
 * @param {string[]} options.paths
 * @param {Context} options.context
 * @returns ShieldAuthorization
 */
export declare function getShieldAuthorization({ shield, paths, context, }: {
    shield: Shield;
    paths: string[];
    context: Context;
}): Promise<ShieldAuthorization>;
/**
 * #### Returns GraphQL query depth for any given Query.
 *
 * @param {any} options
 * @param {string[]} options.paths
 * @param {Context} options.context
 * @param {any} options.fieldsMapping
 * @returns number
 */
export declare function getDepth({ paths, context, fieldsMapping }: {
    paths: string[];
    context: Context;
    fieldsMapping: any;
}): number;
/**
 * #### Execute hooks that apply to a given Query.
 *
 * @param {any} options
 * @param {'before' | 'after'} options.when
 * @param {any} options.hooks
 * @param {PrismaClient} options.prismaClient
 * @param {QueryParams} options.QueryParams
 * @param {any | any[]} options.result
 * @returns Promise<void | any>
 */
export declare function runHooks({ when, hooks, prismaClient, QueryParams, result, }: {
    when: 'before' | 'after';
    hooks: any;
    prismaClient: PrismaClient;
    QueryParams: QueryParams;
    result?: any | any[];
}): Promise<void | any>;
export declare function preventDOS({ callerUuid, maxReqPerMinute, }: {
    callerUuid: string;
    maxReqPerMinute: number;
}): Promise<{
    limitExceeded: boolean;
    count: number;
}>;
