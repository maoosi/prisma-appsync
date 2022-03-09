import { PrismaClient } from '@prisma/client';
export declare type PrismaAppSyncOptionsType = {
    connectionString?: string;
    sanitize?: boolean;
    debug?: boolean;
    defaultPagination?: number | false;
    maxDepth?: number;
};
export declare type Options = Required<PrismaAppSyncOptionsType> & {
    generatedConfig: any;
};
export declare type Action = typeof Actions[keyof typeof Actions] | string;
export declare type ActionsAlias = typeof ActionsAliases[keyof typeof ActionsAliases] | 'custom' | null;
export declare type ActionsAliasStr = keyof typeof ActionsAliases;
export declare type Operation = `${Action}${Capitalize<Model>}`;
export declare type Context = {
    action: Action;
    alias: ActionsAlias;
    model: Model | null;
};
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
export declare type QueryParams = {
    type: GraphQLType;
    operation: Operation | string;
    context: Context;
    fields: string[];
    paths: string[];
    args: any;
    prismaArgs: PrismaArgs;
    authorization: Authorization;
    identity: Identity;
};
export declare type Authorization = typeof Authorizations[keyof typeof Authorizations] | null;
export declare type QueryBuilder = {
    get: (prismaArgs: PrismaArgs) => any;
    list: (prismaArgs: PrismaArgs) => any;
    count: (prismaArgs: PrismaArgs) => any;
    create: (prismaArgs: PrismaArgs) => any;
    createMany: (prismaArgs: PrismaArgs) => any;
    update: (prismaArgs: PrismaArgs) => any;
    updateMany: (prismaArgs: PrismaArgs) => any;
    upsert: (prismaArgs: PrismaArgs) => any;
    delete: (prismaArgs: PrismaArgs) => any;
    deleteMany: (prismaArgs: PrismaArgs) => any;
};
export declare type QueryParamsCustom = QueryParams & {
    prismaClient: PrismaClient;
    queryBuilder: QueryBuilder;
};
export declare type BeforeHookParams = QueryParams & {
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
export declare type AfterHookParams = QueryParams & {
    prismaClient: PrismaClient;
    result: any | any[];
};
export declare type Reason = string | ((context: Context) => string);
export declare type Shield = {
    [matcher: string]: boolean | {
        rule: boolean | any;
        reason?: Reason;
    };
};
export declare type HooksProps = {
    before: BeforeHookParams;
    after: AfterHookParams;
};
export declare type HookPath<Models extends string, CustomResolvers> = `${ActionsAliasStr}/${Uncapitalize<Models>}` | CustomResolvers;
export declare type HooksParameter<HookType extends 'before' | 'after', Models extends string, CustomResolvers extends string> = `${HookType}:${HookPath<Models, CustomResolvers>}`;
export declare type HooksParameters<HookType extends 'before' | 'after', Models extends string, CustomResolvers extends string> = {
    [matcher in HooksParameter<HookType, Models, CustomResolvers>]?: (props: HooksProps[HookType]) => Promise<any>;
};
export declare type Hooks<Models extends string, CustomResolvers extends string> = HooksParameters<'before', Models, CustomResolvers> | HooksParameters<'after', Models, CustomResolvers>;
export declare type ShieldAuthorization = {
    canAccess: boolean;
    reason: Reason;
    prismaFilter: any;
    matcher: string;
    globPattern: string;
};
export declare type ResolveParams<Models extends string, CustomResolvers extends string> = {
    event: AppsyncEvent;
    resolvers?: {
        [resolver in CustomResolvers]: ((props: QueryParamsCustom) => Promise<any>) | boolean;
    };
    shield?: (props: QueryParams) => Shield;
    hooks?: Hooks<Models, CustomResolvers>;
};
export { PrismaClient };
export declare type Model = string;
export declare type PrismaArgs = {
    where?: any;
    data?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    skipDuplicates?: boolean;
    select?: any;
};
export declare type AppsyncEvent = {
    arguments: any;
    source: any;
    identity: Identity;
    request: any;
    info: {
        fieldName: string;
        parentTypeName: string;
        variables: any;
        selectionSetList: string[];
        selectionSetGraphQL: string;
    };
    prev: {
        result: any;
    };
    stash: any;
};
export declare type GraphQLType = 'Query' | 'Mutation' | 'Subscription';
export declare type API_KEY = null | {
    [key: string]: any;
};
export declare type AWS_LAMBDA = {
    resolverContext: any;
    [key: string]: any;
};
export declare type AWS_IAM = {
    accountId: string;
    cognitoIdentityPoolId: string;
    cognitoIdentityId: string;
    sourceIp: string[];
    username: string;
    userArn: string;
    cognitoIdentityAuthType: string;
    cognitoIdentityAuthProvider: string;
    [key: string]: any;
};
export declare type AMAZON_COGNITO_USER_POOLS = {
    sub: string;
    issuer: string;
    username: string;
    claims: any;
    sourceIp: string[];
    defaultAuthStrategy: string;
    groups: string[];
    [key: string]: any;
};
export declare type OPENID_CONNECT = {
    claims: {
        sub: string;
        aud: string;
        azp: string;
        iss: string;
        exp: number;
        iat: number;
        gty: string;
    };
    sourceIp: string[];
    issuer: string;
    sub: string;
    [key: string]: any;
};
export declare type Identity = API_KEY | AWS_LAMBDA | AWS_IAM | AMAZON_COGNITO_USER_POOLS | OPENID_CONNECT;
export declare const ReservedPrismaKeys: string[];
export declare enum Actions {
    get = "get",
    list = "list",
    count = "count",
    createMany = "createMany",
    updateMany = "updateMany",
    deleteMany = "deleteMany",
    create = "create",
    update = "update",
    upsert = "upsert",
    delete = "delete",
    onCreatedMany = "onCreatedMany",
    onUpdatedMany = "onUpdatedMany",
    onDeletedMany = "onDeletedMany",
    onMutatedMany = "onMutatedMany",
    onCreated = "onCreated",
    onUpdated = "onUpdated",
    onUpserted = "onUpserted",
    onDeleted = "onDeleted",
    onMutated = "onMutated"
}
export declare enum ActionsAliases {
    access = "access",
    batchAccess = "batchAccess",
    create = "create",
    batchCreate = "batchCreate",
    delete = "delete",
    batchDelete = "batchDelete",
    modify = "modify",
    batchModify = "batchModify",
    subscribe = "subscribe",
    batchSubscribe = "batchSubscribe"
}
export declare const ActionsAliasesList: {
    readonly access: readonly [Actions.get, Actions.list, Actions.count];
    readonly batchAccess: readonly [Actions.list, Actions.count];
    readonly create: readonly [Actions.create, Actions.createMany];
    readonly batchCreate: readonly [Actions.createMany];
    readonly modify: readonly [Actions.upsert, Actions.update, Actions.updateMany, Actions.delete, Actions.deleteMany];
    readonly batchModify: readonly [Actions.updateMany, Actions.deleteMany];
    readonly delete: readonly [Actions.delete, Actions.deleteMany];
    readonly batchDelete: readonly [Actions.deleteMany];
    readonly subscribe: readonly [Actions.onCreatedMany, Actions.onUpdatedMany, Actions.onDeletedMany, Actions.onMutatedMany, Actions.onCreated, Actions.onUpdated, Actions.onUpserted, Actions.onDeleted, Actions.onMutated];
    readonly batchSubscribe: readonly [Actions.onCreatedMany, Actions.onUpdatedMany, Actions.onDeletedMany, Actions.onMutatedMany];
};
export declare const ActionsList: string[];
export declare const BatchActionsList: string[];
export declare const DebugTestingKey = "__prismaAppsync";
/**
 * ### Authorizations
 *
 * - `API_KEY`: Via hard-coded API key passed into `x-api-key` header.
 * - `AWS_IAM`: Via IAM identity and associated IAM policy rules.
 * - `AMAZON_COGNITO_USER_POOLS`: Via Amazon Cognito user token.
 * - `AWS_LAMBDA`: Via an AWS Lambda function.
 * - `OPENID_CONNECT`: Via Open ID connect such as Auth0.
 *
 * https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
 */
export declare enum Authorizations {
    API_KEY = "API_KEY",
    AWS_IAM = "AWS_IAM",
    AMAZON_COGNITO_USER_POOLS = "AMAZON_COGNITO_USER_POOLS",
    AWS_LAMBDA = "AWS_LAMBDA",
    OPENID_CONNECT = "OPENID_CONNECT"
}