import type { Action, ActionsAlias, AppSyncEvent, Authorization, Context, GraphQLType, Identity, Options, PrismaArgs, QueryParams } from './defs';
/**
 * #### Parse AppSync direct resolver `event` and returns Query Params.
 *
 * @param  {AppSyncEvent} appsyncEvent - AppSync event received in Lambda.
 * @param  {Required<PrismaAppSyncOptionsType>} options - PrismaAppSync Client options.
 * @param  {any|null} customResolvers? - Custom Resolvers.
 * @returns `{ type, operation, context, fields, paths, args, prismaArgs, authorization, identity }` - QueryParams
 */
export declare function parseEvent(appsyncEvent: AppSyncEvent, options: Options, customResolvers?: any | null): QueryParams;
/**
 * #### Convert undefined's to NULL's.
 *
 * @param {any} data
 * @returns any
 */
export declare function addNullables(data: any): any;
/**
 * #### Returns authorization and identity.
 *
 * @param {any} options
 * @param {AppSyncEvent} options.appsyncEvent - AppSync event received in Lambda.
 * @returns `{ authorization, identity }`
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html#aws-appsync-resolver-context-reference-identity
 */
export declare function getAuthIdentity({ appsyncEvent }: {
    appsyncEvent: AppSyncEvent;
}): {
    identity: Identity;
    authorization: Authorization;
};
/**
 * #### Returns context (`action`, `alias` and `model`).
 *
 * @param  {any} options
 * @param  {any|null} options.customResolvers
 * @param  {string} options.operation
 * @param  {Options} options.options
 * @returns Context
 */
export declare function getContext({ customResolvers, operation, options, }: {
    customResolvers?: any | null;
    operation: string;
    options: Options;
}): Context;
/**
 * #### Returns operation (`getPost`, `listUsers`, ..).
 *
 * @param  {any} options
 * @param  {string} options.fieldName
 * @returns Operation
 */
export declare function getOperation({ fieldName }: {
    fieldName: string;
}): string;
/**
 * #### Returns action (`get`, `list`, `create`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @returns Action
 */
export declare function getAction({ operation }: {
    operation: string;
}): Action;
/**
 * #### Returns action alias (`access`, `create`, `modify`, `subscribe`).
 *
 * @param  {any} options
 * @param  {Action} options.action
 * @returns ActionsAlias
 */
export declare function getActionAlias({ action }: {
    action: Action;
}): ActionsAlias;
/**
 * #### Returns model (`Post`, `User`, ...).
 *
 * @param  {any} options
 * @param  {string} options.operation
 * @param  {Action} options.action
 * @returns Model
 */
export declare function getModel({ operation, action }: {
    operation: string;
    action: Action;
}): string;
/**
 * #### Returns fields (`title`, `author`, ...).
 *
 * @param  {any} options
 * @param  {string[]} options._selectionSetList
 * @returns string[]
 */
export declare function getFields({ _selectionSetList }: {
    _selectionSetList: string[];
}): string[];
/**
 * #### Returns GraphQL type (`Query`, `Mutation` or `Subscription`).
 *
 * @param {any} options
 * @param {string} options._parentTypeName
 * @returns GraphQLType
 */
export declare function getType({ _parentTypeName }: {
    _parentTypeName: string;
}): GraphQLType;
/**
 * #### Returns Prisma args (`where`, `data`, `orderBy`, ...).
 *
 * @param {any} options
 * @param {Action} options.action
 * @param {Options['defaultPagination']} options.defaultPagination
 * @param {any} options._arguments
 * @param {any} options._selectionSetList
 * @returns PrismaArgs
 */
export declare function getPrismaArgs({ action, defaultPagination, _arguments, _selectionSetList, }: {
    action: Action;
    defaultPagination: Options['defaultPagination'];
    _arguments: any;
    _selectionSetList: any;
}): PrismaArgs;
/**
 * #### Returns req and res paths (`/update/post/title`, `/get/post/date`, ..).
 *
 * @param {any} options
 * @param {Context} options.context
 * @param {any} options.args
 * @param {PrismaArgs} options.prismaArgs
 * @returns string[]
 */
export declare function getPaths({ context, args, prismaArgs, }: {
    context: Context;
    args: any;
    prismaArgs: PrismaArgs;
}): string[];
