import { PrismaClient } from '@prisma/client';
export declare type PrismaAppSyncOptions = {
    connectionString?: string;
    sanitize?: boolean;
    debug?: boolean;
    defaultPagination?: number | false;
    maxDepth?: number;
};
export declare type Options = Required<PrismaAppSyncOptions> & {
    generatedConfig: any;
};
export declare type Action = typeof Actions[keyof typeof Actions] | string;
export declare type ActionsAlias = keyof typeof ActionsAliases | null;
export declare type Operation = `${Action}${Capitalize<Model>}`;
export declare type Context = {
    action: Action;
    alias: Action | 'custom' | null;
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
export declare type QueryParamsCustom = QueryParams & {
    prismaClient: PrismaClient;
};
export declare type QueryParamsBefore = QueryParams & {
    prismaClient: PrismaClient;
};
/**
 * ### QueryParamsAfter
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
export declare type QueryParamsAfter = QueryParams & {
    prismaClient: PrismaClient;
    result: any | any[];
};
export declare type Shield = {
    [matcher: string]: boolean | {
        rule: boolean | any;
        reason?: string | Function;
    };
};
export declare type HooksProps = {
    before: QueryParamsBefore;
    after: QueryParamsAfter;
};
export declare type HookPath<CustomResolvers> = `${Lowercase<NonNullable<ActionsAlias>>}/${Lowercase<Model>}` | CustomResolvers;
export declare type HooksParameter<HookType extends 'before' | 'after', CustomResolvers extends string> = `${HookType}:${HookPath<CustomResolvers>}`;
export declare type HooksParameters<HookType extends 'before' | 'after', CustomResolvers extends string> = {
    [matcher in HooksParameter<HookType, CustomResolvers>]?: (props: HooksProps[HookType]) => Promise<any>;
};
export declare type Hooks<CustomResolvers extends string> = HooksParameters<'before', CustomResolvers> | HooksParameters<'after', CustomResolvers>;
export declare type ShieldAuthorization = {
    canAccess: boolean;
    reason: string | Function;
    prismaFilter: any;
    matcher: string;
};
export declare type ResolveParams<CustomResolvers extends string> = {
    event: AppsyncEvent;
    resolvers?: {
        [resolver in CustomResolvers]: ((props: QueryParamsCustom) => Promise<any>) | boolean;
    };
    shield?: (props: QueryParams) => Shield;
    hooks?: () => Hooks<CustomResolvers>;
};
export { PrismaClient };
export declare type Model = typeof Models[keyof typeof Models];
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
export declare const Models: {
    User: "User";
    hiddenModel: "hiddenModel";
    Post: "Post";
};
export declare const ReservedPrismaKeys: string[];
export declare const Actions: {
    readonly get: "get";
    readonly list: "list";
    readonly count: "count";
    readonly createMany: "createMany";
    readonly updateMany: "updateMany";
    readonly deleteMany: "deleteMany";
    readonly create: "create";
    readonly update: "update";
    readonly upsert: "upsert";
    readonly delete: "delete";
    readonly onCreatedMany: "onCreatedMany";
    readonly onUpdatedMany: "onUpdatedMany";
    readonly onDeletedMany: "onDeletedMany";
    readonly onMutatedMany: "onMutatedMany";
    readonly onCreated: "onCreated";
    readonly onUpdated: "onUpdated";
    readonly onUpserted: "onUpserted";
    readonly onDeleted: "onDeleted";
    readonly onMutated: "onMutated";
};
export declare const ActionsAliases: {
    readonly access: "access";
    readonly batchAccess: "batchAccess";
    readonly create: "create";
    readonly batchCreate: "batchCreate";
    readonly delete: "delete";
    readonly batchDelete: "batchDelete";
    readonly modify: "modify";
    readonly batchModify: "modify";
    readonly subscribe: "subscribe";
    readonly batchSubscribe: "subscribe";
};
export declare const ActionsAliasesList: {
    readonly access: readonly ["get", "list", "count"];
    readonly batchAccess: readonly ["list", "count"];
    readonly create: readonly ["create", "createMany"];
    readonly batchCreate: readonly ["createMany"];
    readonly modify: readonly ["upsert", "update", "updateMany", "delete", "deleteMany"];
    readonly batchModify: readonly ["updateMany", "deleteMany"];
    readonly delete: readonly ["delete", "deleteMany"];
    readonly batchDelete: readonly ["deleteMany"];
    readonly subscribe: readonly ["onCreatedMany", "onUpdatedMany", "onDeletedMany", "onMutatedMany", "onCreated", "onUpdated", "onUpserted", "onDeleted", "onMutated"];
    readonly batchSubscribe: readonly ["onCreatedMany", "onUpdatedMany", "onDeletedMany", "onMutatedMany"];
};
export declare const ActionsList: string[];
export declare const BatchActionsList: string[];
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
export declare const Authorizations: {
    readonly API_KEY: "API_KEY";
    readonly AWS_IAM: "AWS_IAM";
    readonly AMAZON_COGNITO_USER_POOLS: "AMAZON_COGNITO_USER_POOLS";
    readonly AWS_LAMBDA: "AWS_LAMBDA";
    readonly OPENID_CONNECT: "OPENID_CONNECT";
};
