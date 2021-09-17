import { PrismaClient } from '@prisma/client';
export { PrismaClient };
export declare type AppSyncIdentity = {
    accountId: string;
    cognitoIdentityPoolId: string;
    cognitoIdentityId: string;
    sourceIp: string[];
    username: string;
    userArn: string;
    cognitoIdentityAuthType: string;
    cognitoIdentityAuthProvider: string;
} | {
    sub: string;
    issuer: string;
    username: string;
    claims: any;
    sourceIp: string[];
    defaultAuthStrategy: string;
} | {
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
} | {
    resolverContext: any;
} | null;
export declare type AppsyncEvent = {
    arguments: any;
    source: any;
    identity: AppSyncIdentity;
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
export declare type PrismaAppSyncOptions = {
    generatedConfig?: any;
    connectionString?: string;
    sanitize?: boolean;
    debug?: boolean;
    defaultPagination?: number | false;
    maxDepth?: number;
};
export declare type ResolveParams = {
    event: AppsyncEvent;
    resolvers?: object;
    shield?: (ResolverQuery: any) => Shield;
    hooks?: (ResolverQuery: any) => Hooks;
};
export declare const ReservedPrismaKeys: string[];
export declare const Models: {
    User: "User";
    hiddenModel: "hiddenModel";
    Post: "Post";
};
export declare type Model = typeof Models[keyof typeof Models];
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
export declare type Action = typeof Actions[keyof typeof Actions] | string;
export declare type ActionsAlias = keyof typeof ActionsAliases;
export declare type GraphQLType = 'Query' | 'Mutation' | 'Subscription';
export declare type Subject = {
    actionAlias: ActionsAlias;
    model: Model;
} | string;
export declare type ResolverQuery = {
    operation: string;
    action: Action;
    subject: Subject;
    fields: string[];
    args: Args;
    type: GraphQLType;
    authIdentity: AuthIdentity;
    paths: string[];
};
export declare const AuthModes: {
    readonly API_KEY: "API_KEY";
    readonly AWS_IAM: "AWS_IAM";
    readonly AMAZON_COGNITO_USER_POOLS: "AMAZON_COGNITO_USER_POOLS";
    readonly AWS_LAMBDA: "AWS_LAMBDA";
    readonly AWS_OIDC: "AWS_OIDC";
};
export declare type AuthIdentity = {
    authorization: typeof AuthModes[keyof typeof AuthModes];
    [key: string]: any;
};
export declare type Args = {
    where?: any;
    data?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    skipDuplicates?: boolean;
    select?: any;
};
export declare type Shield = {
    [matcher: string]: {
        rule: boolean | object;
        reason?: string | Function;
    } | boolean;
};
export declare type Hooks = {
    [matcher: string]: Function;
};
export declare type Authorization = {
    canAccess: boolean;
    reason: string | Function;
    prismaFilter: object;
    matcher: string;
};
