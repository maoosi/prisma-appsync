import type { Options, PrismaAppSyncOptionsType, ResolveParams } from './types';
import { Prisma, PrismaClient } from './types';
/**
 * ##  Prisma-AppSync Client ʲˢ
 *
 * Type-safe Prisma AppSync client for TypeScript & Node.js
 * @example
 * ```
 * const prismaAppSync = new PrismaAppSync()
 *
 * // lambda handler (AppSync Direct Lambda Resolver)
 * export const resolver = async (event: any, context: any) => {
 *     return await prismaAppSync.resolve({ event })
 * }
 * ```
 *
 *
 * Read more in our [docs](https://prisma-appsync.vercel.app).
 */
export declare class PrismaAppSync {
    options: Options;
    prismaClient: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>;
    /**
   * ### Client Constructor
   *
   * Instantiate Prisma-AppSync Client.
   * @example
   * ```
   * const prismaAppSync = new PrismaAppSync()
   * ```
   *
   * @param {PrismaAppSyncOptionsType} options
   * @param {string} options.connectionString? - Prisma connection string (database connection URL).
   * @param {boolean} options.sanitize? - Enable sanitize inputs (parse xss + encode html).
   * @param {'INFO' | 'WARN' | 'ERROR'} options.logLevel? - Server logs level (visible in CloudWatch).
   * @param {number|false} options.defaultPagination? - Default pagination for list Query (items per page).
   * @param {number} options.maxDepth? - Maximum allowed GraphQL query depth.
   * @param {number} options.maxReqPerUserMinute? - Maximum allowed requests per user, per minute.
   *
   * @default
   * ```
   * {
   *   connectionString: process.env.DATABASE_URL,
   *   sanitize: true,
   *   logLevel: 'INFO',
   *   defaultPagination: 50,
   *   maxDepth: 3,
   *   maxReqPerUserMinute: 200
   * }
   * ```
   *
   *
   * Read more in our [docs](https://prisma-appsync.vercel.app).
   */
    constructor(options?: PrismaAppSyncOptionsType);
    /**
   * ###  Resolver
   *
   * Resolve the API request, based on the AppSync `event` received by the Direct Lambda Resolver.
   * @example
   * ```
   * await prismaAppSync.resolve({ event })
   *
   * // custom resolvers
   * await prismaAppSync.resolve<'notify'|'listPosts'>(
   *     event,
   *     resolvers: {
   *         // extend CRUD API with a custom `notify` query
   *         notify: async ({ args }) => { return { message: args.message } },
   *
   *         // disable one of the generated CRUD API query
   *         listPosts: false,
   *     }
   * })
   * ```
   *
   * @param {ResolveParams} resolveParams
   * @param {any} resolveParams.event - AppSync event received by the Direct Lambda Resolver.
   * @param {any} resolveParams.resolvers? - Custom resolvers (to extend the CRUD API).
   * @param {function} resolveParams.shield? - Shield configuration (to protect your API).
   * @param {function} resolveParams.hooks? - Hooks (to trigger functions based on events).
   * @returns Promise<result>
   *
   *
   * Read more in our [docs](https://prisma-appsync.vercel.app).
   */
    resolve<CustomResolvers = void>(resolveParams: ResolveParams<"countComments" | "countLikes" | "countPosts" | "countProfiles" | "countUsers" | "createComment" | "createLike" | "createManyComments" | "createManyLikes" | "createManyPosts" | "createManyProfiles" | "createManyUsers" | "createPost" | "createProfile" | "createUser" | "deleteComment" | "deleteLike" | "deleteManyComments" | "deleteManyLikes" | "deleteManyPosts" | "deleteManyProfiles" | "deleteManyUsers" | "deletePost" | "deleteProfile" | "deleteUser" | "getComment" | "getLike" | "getPost" | "getProfile" | "getUser" | "listComments" | "listLikes" | "listPosts" | "listProfiles" | "listUsers" | "onCreatedComment" | "onCreatedLike" | "onCreatedManyComments" | "onCreatedManyLikes" | "onCreatedManyPosts" | "onCreatedManyProfiles" | "onCreatedManyUsers" | "onCreatedPost" | "onCreatedProfile" | "onCreatedUser" | "onDeletedComment" | "onDeletedLike" | "onDeletedManyComments" | "onDeletedManyLikes" | "onDeletedManyPosts" | "onDeletedManyProfiles" | "onDeletedManyUsers" | "onDeletedPost" | "onDeletedProfile" | "onDeletedUser" | "onMutatedComment" | "onMutatedLike" | "onMutatedManyComments" | "onMutatedManyLikes" | "onMutatedManyPosts" | "onMutatedManyProfiles" | "onMutatedManyUsers" | "onMutatedPost" | "onMutatedProfile" | "onMutatedUser" | "onUpdatedComment" | "onUpdatedLike" | "onUpdatedManyComments" | "onUpdatedManyLikes" | "onUpdatedManyPosts" | "onUpdatedManyProfiles" | "onUpdatedManyUsers" | "onUpdatedPost" | "onUpdatedProfile" | "onUpdatedUser" | "onUpsertedComment" | "onUpsertedLike" | "onUpsertedPost" | "onUpsertedProfile" | "onUpsertedUser" | "updateComment" | "updateLike" | "updateManyComments" | "updateManyLikes" | "updateManyPosts" | "updateManyProfiles" | "updateManyUsers" | "updatePost" | "updateProfile" | "updateUser" | "upsertComment" | "upsertLike" | "upsertPost" | "upsertProfile" | "upsertUser", Extract<CustomResolvers, string>>): Promise<any>;
}
