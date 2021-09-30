import { PrismaAppSyncOptions, AppsyncEvent, QueryParams, Action, Model, Context, PrismaArgs, ActionsAlias, Operation, Identity, Authorization } from './defs';
/**
 * Parse AppSync direct resolver event and returns Query Params.
 * @param  appsyncEvent AppSync event received in Lambda.
 * @param  options PrismaAppSync Client options.
 * @param  customResolvers Custom Resolvers.
 * @returns `QueryParams`
 */
export declare function parseEvent(appsyncEvent: AppsyncEvent, options: PrismaAppSyncOptions, customResolvers?: any | null): QueryParams;
/**
 * Return auth. identity from parsed `event`.
 * @param  {{appsyncEvent:any}} {appsyncEvent}
 * @returns AuthIdentity
 */
export declare function getAuthIdentity({ appsyncEvent }: {
    appsyncEvent: any;
}): {
    identity: Identity;
    authorization: Authorization;
};
/**
 * Return operation (`getPost`, `listUsers`, ...) from parsed `event.info.fieldName`.
 * @param  {{fieldName:string}} {fieldName}
 * @returns string
 */
export declare function getOperation({ fieldName }: {
    fieldName: string;
}): Operation;
/**
 * Return action (`get`, `list`, `create`, ...) from parsed `operation`.
 * @param  {{operation:string}} {operation}
 * @returns Action
 */
export declare function getAction({ operation }: {
    operation: string;
}): Action;
/**
 * Return action alias (`access`, `create`, `modify`, `subscribe`) from parsed `action`.
 * @param  {{action:string}} {action}
 * @returns ActionsAlias
 */
export declare function getActionAlias({ action }: {
    action: Action;
}): ActionsAlias;
/**
 *  Return model (`Post`, `User`, ...) from parsed `operation` and `action`.
 * @param  {{operation:string, action:Action}} {operation, action}
 * @returns Model
 */
export declare function getModel({ operation, action }: {
    operation: string;
    action: Action;
}): Model;
/**
 * Return fields (`title`, `author`, ...) from parsed `event.info.selectionSetList`.
 * @param  {{_selectionSetList:string[]}} {_selectionSetList}
 * @returns string[]
 */
export declare function getFields({ _selectionSetList }: {
    _selectionSetList: string[];
}): string[];
/**
 * Return GraphQL type (`Query`, `Mutation` or `Subscription`) from parsed `event.info.parentTypeName`.
 * @param  {{_parentTypeName:string}} {_parentTypeName}
 * @returns 'Query' | 'Mutation' | 'Subscription'
 */
export declare function getType({ _parentTypeName }: {
    _parentTypeName: string;
}): 'Query' | 'Mutation' | 'Subscription';
/**
 * Return Prisma args (`where`, `data`, `orderBy`, ...) from parsed `action` and `event.arguments`.
 * @param  {{action: Action, _arguments:any, defaultPagination:false|number}} { action, _arguments, defaultPagination }
 * @returns Args
 */
export declare function getPrismaArgs({ action, _arguments, _selectionSetList, defaultPagination }: {
    action: Action;
    _arguments: any;
    _selectionSetList: any;
    defaultPagination: false | number;
}): PrismaArgs;
/**
 * Return req and res paths (`/update/post/title`, `/get/post/date`, ...)
 * @param  {{action:Action, subject:Subject, args:Args}} {action, subject, args}
 * @returns string[]
 */
export declare function getPaths({ context, prismaArgs }: {
    context: Context;
    prismaArgs: PrismaArgs;
}): string[];
