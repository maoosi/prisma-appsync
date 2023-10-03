import { Prisma, PrismaClient } from '@prisma/client';
import type { AppSyncIdentity, AppSyncIdentityCognito, AppSyncIdentityIAM, AppSyncIdentityLambda, AppSyncIdentityOIDC, AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import type { Actions, ActionsAliases, Authorizations } from './consts';
export type logLevel = 'INFO' | 'WARN' | 'ERROR';
export type PrismaAppSyncOptionsType = {
    connectionString?: string;
    sanitize?: boolean;
    logLevel?: logLevel;
    defaultPagination?: number | false;
    maxDepth?: number;
    maxReqPerUserMinute?: number | false;
};
export type Options = Required<PrismaAppSyncOptionsType> & {
    modelsMapping: any;
    fieldsMapping: any;
};
export type InjectedConfig = {
    modelsMapping?: {
        [modelVariant: string]: {
            prismaRef: string;
            singular: string;
            plural: string;
        };
    };
    fieldsMapping?: {
        [fieldPath: string]: {
            type: string;
            isRelation: boolean;
        };
    };
    operations?: string;
};
export type RuntimeConfig = {
    modelsMapping: {
        [modelVariant: string]: {
            prismaRef: string;
            singular: string;
            plural: string;
        };
    };
    fieldsMapping: {
        [fieldPath: string]: {
            type: string;
            isRelation: boolean;
        };
    };
    operations: string[];
};
export type Action = typeof Actions[keyof typeof Actions] | string;
export type ActionsAlias = typeof ActionsAliases[keyof typeof ActionsAliases] | 'custom' | null;
export type ActionsAliasStr = keyof typeof ActionsAliases;
export type Context = {
    action: Action;
    alias: ActionsAlias;
    model: Model;
};
export type Model = {
    prismaRef: string;
    singular: string;
    plural: string;
} | null;
export type { AppSyncResolverHandler, AppSyncResolverEvent, AppSyncIdentity };
/**
 * ### QueryParams
 *
 * @example
 * ```
 * {
 *     type: 'Query',
 *     operation: 'getPost',
 *     context: { action: 'get', alias: 'access', model: 'Post' },
 *     fields: ['title', 'status'],
 *     paths: ['get/post/title', 'get/post/status'],
 *     args: { where: { id: 5 } },
 *     prismaArgs: {
 *         where: { id: 5 },
 *         select: { title: true, status: true },
 *     },
 *     authorization: 'API_KEY',
 *     identity: { ... },
 * }
 * ```
 */
export type QueryParams<T = any> = {
    type: GraphQLType;
    operation: string;
    context: Context;
    fields: string[];
    paths: string[];
    args: T;
    prismaArgs: PrismaArgs;
    authorization: Authorization;
    identity: Identity;
    headers: any;
};
export type Authorization = typeof Authorizations[keyof typeof Authorizations] | null;
export type PrismaGet = Pick<Required<PrismaArgs>, 'where'> & Pick<PrismaArgs, 'select'>;
export type PrismaList = Pick<PrismaArgs, 'where' | 'orderBy' | 'select' | 'skip' | 'take'>;
export type PrismaCount = Pick<PrismaArgs, 'where' | 'orderBy' | 'select' | 'skip' | 'take'>;
export type PrismaCreate = Pick<Required<PrismaArgs>, 'data'> & Pick<PrismaArgs, 'select'>;
export type PrismaCreateMany = Pick<Required<PrismaArgs>, 'data'> & Pick<PrismaArgs, 'skipDuplicates'>;
export type PrismaUpdate = Pick<Required<PrismaArgs>, 'data' | 'where'> & Pick<PrismaArgs, 'select'>;
export type PrismaUpdateMany = Pick<Required<PrismaArgs>, 'data' | 'where'>;
export type PrismaUpsert = Pick<Required<PrismaArgs>, 'where'> & Pick<PrismaArgs, 'select'> & Pick<PrismaArgs, 'update'> & Pick<PrismaArgs, 'create'>;
export type PrismaDelete = Pick<Required<PrismaArgs>, 'where'> & Pick<PrismaArgs, 'select'>;
export type PrismaDeleteMany = Pick<Required<PrismaArgs>, 'where'>;
export type QueryBuilder = {
    prismaGet: (...prismaArgs: PrismaArgs[]) => PrismaGet;
    prismaList: (...prismaArgs: PrismaArgs[]) => PrismaList;
    prismaCount: (...prismaArgs: PrismaArgs[]) => PrismaCount;
    prismaCreate: (...prismaArgs: PrismaArgs[]) => PrismaCreate;
    prismaCreateMany: (...prismaArgs: PrismaArgs[]) => PrismaCreateMany;
    prismaUpdate: (...prismaArgs: PrismaArgs[]) => PrismaUpdate;
    prismaUpdateMany: (...prismaArgs: PrismaArgs[]) => PrismaUpdateMany;
    prismaUpsert: (...prismaArgs: PrismaArgs[]) => PrismaUpsert;
    prismaDelete: (...prismaArgs: PrismaArgs[]) => PrismaDelete;
    prismaDeleteMany: (...prismaArgs: PrismaArgs[]) => PrismaDeleteMany;
};
export type QueryParamsCustom<T = any> = QueryParams<T> & {
    prismaClient: PrismaClient;
};
export type BeforeHookParams = QueryParams & {
    prismaClient: PrismaClient;
};
/**
 * ### AfterHookParams
 *
 * @example
 * ```
 * {
 *     type: 'Query',
 *     operation: 'getPost',
 *     context: { action: 'get', alias: 'access', model: 'Post' },
 *     fields: ['title', 'status'],
 *     paths: ['get/post/title', 'get/post/status'],
 *     args: { where: { id: 5 } },
 *     prismaArgs: {
 *         where: { id: 5 },
 *         select: { title: true, status: true },
 *     },
 *     authorization: 'API_KEY',
 *     identity: { ... },
 *     result: { title: 'Hello World', status: 'PUBLISHED' }
 * }
 * ```
 */
export type AfterHookParams = QueryParams & {
    prismaClient: PrismaClient;
    result: any | any[];
};
export type ShieldContext = {
    action: Action;
    model: string;
};
export type Reason = string | ((context: ShieldContext) => string);
export type ShieldRule = boolean | ((context: ShieldContext) => boolean | Promise<boolean>) | any;
export type Shield = {
    [matcher: string]: boolean | {
        rule: ShieldRule;
        reason?: Reason;
    };
};
export type HooksProps = {
    before: BeforeHookParams;
    after: AfterHookParams;
};
export type HooksReturn = {
    before: Promise<BeforeHookParams>;
    after: Promise<AfterHookParams>;
};
export type HookPath<Operations extends string, CustomResolvers> = Operations | CustomResolvers;
export type HooksParameter<HookType extends 'before' | 'after', Operations extends string, CustomResolvers extends string> = `${HookType}:${HookPath<Operations, CustomResolvers>}` | `${HookType}:**`;
export type HooksParameters<HookType extends 'before' | 'after', Operations extends string, CustomResolvers extends string> = {
    [matcher in HooksParameter<HookType, Operations, CustomResolvers>]?: (props: HooksProps[HookType]) => HooksReturn[HookType];
};
export type Hooks<Operations extends string, CustomResolvers extends string> = HooksParameters<'before', Operations, CustomResolvers> | HooksParameters<'after', Operations, CustomResolvers>;
export type ShieldAuthorization = {
    canAccess: boolean;
    reason: Reason;
    prismaFilter: any;
    matcher: string;
    globPattern: string;
};
export type ResolveParams<Operations extends string, CustomResolvers extends string> = {
    event: AppSyncEvent;
    resolvers?: {
        [resolver in CustomResolvers]: ((props: QueryParamsCustom) => Promise<any>) | boolean;
    };
    shield?: (props: QueryParams) => Shield;
    hooks?: Hooks<Operations, CustomResolvers>;
};
export { PrismaClient, Prisma };
export type PrismaArgs = {
    where?: any;
    create?: any;
    update?: any;
    data?: any;
    select?: any;
    orderBy?: any;
    skip?: number | undefined;
    take?: number | undefined;
    skipDuplicates?: boolean | undefined;
};
export type PrismaOperator = keyof Required<PrismaArgs>;
export type AppSyncEvent = AppSyncResolverEvent<any>;
export type GraphQLType = 'Query' | 'Mutation' | 'Subscription';
export type API_KEY = null | {
    [key: string]: any;
};
export type AWS_LAMBDA = AppSyncIdentityLambda;
export type AWS_IAM = AppSyncIdentityIAM;
export type AMAZON_COGNITO_USER_POOLS = AppSyncIdentityCognito;
export type OPENID_CONNECT = AppSyncIdentityOIDC;
export type Identity = API_KEY | AWS_LAMBDA | AWS_IAM | AMAZON_COGNITO_USER_POOLS | OPENID_CONNECT;
