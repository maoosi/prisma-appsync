import { ShieldAuthorization, Shield, Context } from './defs';
/**
 * #### Sanitize data (parse xss + encode html).
 *
 * @param {any} data
 * @returns any
 */
export declare function sanitize(data: any): any;
/**
 * #### Clarify data (decode html).
 *
 * @param {any} data
 * @returns any
 */
export declare function clarify(data: any): any;
/**
 * #### Returns an authorization object from a Shield configuration passed as input.
 *
 * @param {any} options
 * @param {Shield} options.shield
 * @param {string[]} options.paths
 * @returns ShieldAuthorization
 */
export declare function getShieldAuthorization({ shield, paths }: {
    shield: Shield;
    paths: string[];
}): ShieldAuthorization;
/**
 * #### Returns GraphQL query depth for any given Query.
 *
 * @param {any} options
 * @param {string[]} options.paths
 * @param {Context} options.context
 * @returns number
 */
export declare function getDepth({ paths, context }: {
    paths: string[];
    context: Context;
}): number;
