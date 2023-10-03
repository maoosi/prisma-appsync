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
export declare const Prisma_QueryOptions: string[];
export declare const Prisma_NestedQueries: string[];
export declare const Prisma_FilterConditionsAndOperatos: string[];
export declare const Prisma_FilterRelationFilters: string[];
export declare const Prisma_ScalarListMethods: string[];
export declare const Prisma_ScalarListFilters: string[];
export declare const Prisma_CompositeTypeMethods: string[];
export declare const Prisma_CompositeTypeFilters: string[];
export declare const Prisma_AtomicNumberOperations: string[];
export declare const Prisma_JSONFilters: string[];
export declare const Prisma_ReservedKeysForPaths: string[];
export declare const Prisma_ReservedKeys: string[];
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
