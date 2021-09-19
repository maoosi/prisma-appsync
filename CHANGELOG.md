# Changelog

## 🎉 Version 1.0.0-rc.0

### Major improvements

- Prisma-AppSync Client API rewritten from the ground to:
  - Simplify usage by streamlining API and adopting a more opinionated approach. Provide a better TypeScript DX with cleaner naming conventions and closer to Prisma Client.
  - Make fine-grained access control and custom resolvers easier to use and more flexible across all scopes, from small to larger size projects (see shield in the preview below).
  - Adopt a TDD approach with full CI/CD integration. This will help to cover more edge cases and bring Prisma-AppSync to a stable version quicker.
  - Refactor internal code structure, reduce external dependencies and improve execution performances. This should also make contributions to the project much easier for others.

### Breaking changes

#### Prisma-AppSync Client (usage within Lambda function)

##### Default usage

**Before:**

```typescript
// init prisma-appsync client
const app = new PrismaAppSync({
    connectionUrl: process.env.CONNECTION_URL
})

// direct lambda resolver for appsync
export const main = async (event: any, context: any) => {
    // parse the `event` from your Lambda function
    app.parseEvent(event)

    // handle CRUD operations / resolve query
    const result = await app.resolve()

    // close database connection
    await app.prisma.$disconnect()

    // return query result
    return Promise.resolve(result)
}
```

**After:**

```typescript
// init prisma-appsync client
const prismaAppSync = new PrismaAppSync()

// direct lambda resolver for appsync
export const resolver = async (event: any, context: any) => {
    return await prismaAppSync.resolve({
        event: event, // AppSync event
    })
}
```

##### Hooks

**Before:**

```typescript
// execute before resolve
app.beforeResolve(async (props) => {
    // custom business logic here
})

// execute after resolve
app.afterResolve(async (props) => {
    // custom business logic here
})
```

**After:**

```typescript
return await prismaAppSync.resolve({
    event: event, // AppSync event
    hooks: () => {
        return {
            // execute before any query
            'before:**': async (props) => {
                // custom business logic here
            },
            // execute after any query
            'after:**': async (props) => {
                // custom business logic here
            },
            // execute after custom resolver query `likePost`
            // (e.g. `query { likePost(postId: 3) }`)
            'after:custom/likePost': async ({ prismaClient, authIdentity, args }) => {
                await prismaClient.notification.create({
                    data: {
                        event: 'POST_LIKED',
                        targetId: args.postId,
                        userId: authIdentity.sub,
                    }
                })
            },
        }
    }
})
```

### Fixes and improvements

- New: Improved errors with more detailed server logs and better message returned by the GraphQL API, which now include a stringified object such as `"{\"error\":\"Query has depth of 4, which exceeds max depth of 3.\",\"type\":\"FORBIDDEN\",\"code\":401}"`.
- New: TypeScript types improved for better DX. Hovering on Prisma-AppSync types and Client methods using VS Code is now displaying better info, including examples.
- New: Support for Atomic Operations (see example usage below).
- New: Enabling the data sanitizer will now automatically "de-sanitize" data before sending it back to the client. Meaning client-side decoding is not anymore necessary, while your data will still be parsed for XSS before storage.
- Fix: [Issue #26](https://github.com/maoosi/prisma-appsync/issues/26)

#### New: Client options

```typescript
const prismaAppSync = new PrismaAppSync({
    connectionString, // optional, DB connection string, default to env var `DATABASE_URL`
    sanitize, // optional, enable data sanitizer for DB storage (incl. XSS parser), default to true
    debug, // optional, enable debug server logs, default to false
    defaultPagination, // optional, pagination for listQueries, default to 50
    maxDepth, // optional, allowed graphql query depth, default to 3
})
```

#### New: Support for Atomic Operations

```graphql
mutation {
    updateManyPosts(
        operations: {
            views: { increment: 1 }
        }
    )
}
```

## 🎉 Version 1.0.0-beta.58

### ⚠️ (Breaking) Fix: Issue linked to Prisma models naming

Using a model name format other than PascalCase OR already in the plural form, was causing mapping issues between GraphQL queries and Prisma Client.

> This feature is only breaking in case you were NOT following PascalCase naming convention for models OR affected by one of the below examples.

#### Before

- Model `person`: GQL types generated were not using camelCase (`getperson`, `listpersons`, etc...)
- Model `People`: Was wrongly mapping to singular `person` instead of `people`.
- Model `PersonEmails`: Was wrongly mapping to `prismaClient.personemail` instead of `prismaClient.personemails`
- Model `person_emails`: Was throwing an error when calling the API.

#### After

- Model `person`: GQL types are now properly using camelCase (`getPerson`, `listPersons`, etc...)
- Model `People`: Mapping back to the right `people` model.
- Model `PersonEmails`: Mapping back to the right `prismaClient.personemails`
- Model `person_emails`: Properly converted to `getPersonEmails` and mapped back to `prismaClient.person_emails`

### ⚠️ (Breaking) Feat: orderBy query filter updated to support multiple fields

#### Before

```graphql
query {
    listPosts(orderBy: { title: ASC }) {
        title
    }
}
```

#### After

```graphql
query {
    listPosts(
        orderBy: [
            { title: ASC },
            { preview: ASC },
        ]
    ) {
        title
    }
}
```

### 🆕 Feat: New Queries, Mutations and Subscriptions added

```graphql
# New `createMany` mutation (example for Post model)
mutation {
    createManyPosts(
        data: [
            { title: "How to get started with Prisma-AppSync" }
            { title: "How to migrate to Prisma-AppSync" }
        ]
    ) {
        count
    }
}

# New `updateMany` mutation (example for Post model)
mutation {
    updateManyPosts(
        where: { title: { startsWith: "How to" } }
        data: { category: "guides" }
    ) {
        count
    }
}

# New `count` query (example for Post model)
query {
    countPosts(
        where: { title: { startsWith: "How to" } }
    )
}

# New `onUpserted` subscription (example for Post model)
# > Triggered from `upsertPost` mutation.
subscription {
    onUpsertedPost {
        title
        category
    }
}

# New `onMutated` subscription (example for Post model)
# > Triggered from ANY SINGLE record mutation (excl. `on*ManyPosts`).
subscription {
    onMutatedPost {
        title
        category
    }
}

# New `on[Action]Many` subscriptions (example for Post model)
subscription { onCreatedManyPosts { count } }
subscription { onUpdatedManyPosts { count } }
subscription { onDeletedManyPosts { count } }

# New `onMutatedMany` subscription (example for Post model)
# > Triggered from ANY MULTIPLE records mutation (excl. single record mutations).
subscription { onMutatedManyPosts { count } }
```

### 🆕 Misc

- The `authIdentity` property (accessible from the hooks) now includes `requestApiKey` and `requestUserAgent` when using `API_KEY` authorization.
- Comments added in the generate GraphQL schema (visible from AppSync query editor docs).
- Updated Boilerplate to reflect new changes.
- Updated generated API documentation to reflect new changes.
- Upgraded Prisma to v2.25.0.

## 🎉 Version 1.0.0-beta.57

- Feat: Support for prisma ^2.24.1 added.
- Fix: Type issue in the Boilerplate.

## 🎉 Version 1.0.0-beta.56

### ⚠️ Breaking

- Feat: Introducing pagination on list queries.
- Feat: Introducing entirely refactored filters on list queries, closer to the Prisma syntax.

#### Filtering (breaking)

To simplify both usage and implementation, filtering on fields and relations have been refactored entirely. The syntax is now closer to [how Prisma handles filtering](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#filter-conditions-and-operators).

```graphql
# before
query {
    listPosts(
        where: { title_startsWith: "Foo" }
    ) {
        title
    }
}

# after (1.0.0-beta.56+)
query {
    listPosts(
        where: { title: { startsWith: "Foo" } }
    ) {
        title
    }
}
```

```graphql
# before
query {
    listPosts(
        where: { title: "Foo" }
    ) {
        title
    }
}

# after (1.0.0-beta.56+)
query {
    listPosts(
        where: { title: { equals: "Foo" } }
    ) {
        title
    }
}
```

Some Types have also been renamed for more consistency:

- `CreateRelations` renamed to `CreateRelationsInput`
- `UpdateRelations` renamed to `UpdateRelationsInput`
- `WhereInput` renamed to `WhereFilterInput`

#### Pagination (breaking)

Introducing pagination on list queries ([using Prisma offset pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination)).

```graphql
# after (1.0.0-beta.56+)
query {
    listPosts(
        skip: 0
        take: 20
    ) {
        title
    }
}
```

If the `take` parameter is omitted, PrismaAppSync will use a default value of `50`. It is also possible to change the default value:

```typescript
// Set the default value to 50, if the `take` parameter is omitted.
const app = new PrismaAppSync({
    connectionUrl: process.env.DB_CONNECTION_URL,
    defaultPagination: 20
})

// Disable pagination limit, if the `take` parameter is omitted.
const app = new PrismaAppSync({
    connectionUrl: process.env.DB_CONNECTION_URL,
    defaultPagination: false
})
```

### Non-breaking

- Fix: Has no exported member 'Prisma' issue resolved ([issues/11](https://github.com/maoosi/prisma-appsync/issues/11))

## 🎉 Version 1.0.0-beta.53

### ⚠️ Breaking

Version `1.0.0-beta.52` introduced an issue with accessing Prisma client from inside a custom resolver. To address this, the `customResolvers` parameter has been removed from the PrismaAppSync constructor. Instead, PrismaAppSync now exposes a new `registerCustomResolvers` method:

```typescript
// before
const app = new PrismaAppSync({
    connectionUrl: String(process.env.CONNECTION_URL),
    customResolvers: { incrementPostsViews }
})

// after (1.0.0-beta.53+)
const app = new PrismaAppSync({
    connectionUrl: String(process.env.CONNECTION_URL)
})
app.registerCustomResolvers({ incrementPostsViews })
```

### Non-breaking

- Feat: For contributors, running `yarn create prisma-appsync-app . --test` now also creates a custom resolver for testing purpose.
- Fix: PNPM install not running `prisma generate` by default ([issues/11](https://github.com/maoosi/prisma-appsync/issues/11))

## 🎉 Version 1.0.0-beta.52

### ⚠️ Breaking

- Feat: Providing easier access to Prisma Client

```typescript
// initialise client
const app = new PrismaAppSync({
    connectionUrl: process.env.CONNECTION_URL
})

// access Prisma client
app.prisma.$use(async (params, next) => {
  console.log('This is middleware!')
  return next(params)
})
```

**Migration guide:**

- `app.$disconnect` replaced with `app.prisma.$disconnect`.
- `prisma` parameter removed from the before and after hooks functions, as well as from the customResolvers parameters. To access prisma from within hooks, directly use `app.prisma`.

### Non-breaking

- Feat: Support for prisma ^2.21.2 added.
- Feat: Lambda bundle size reduced (provided CDK boilerplate).

```typescript
afterBundling(inputDir: string, outputDir: string): string[] {
    return [
        'npx prisma generate', 
        'rm -rf node_modules/@prisma/engines', 
        'rm -rf node_modules/@prisma/client/node_modules', 
        'rm -rf node_modules/.bin', 
        'rm -rf node_modules/prisma',
        'rm -rf node_modules/prisma-appsync',
    ]
}
```

- Feat: Contribution guide added (see [CONTRIBUTING.md](CONTRIBUTING.md)) with new boilerplate testing workflow.
- Feat: Core library is now using Pnpm instead of Yarn.

## 🎉 Version 1.0.0-beta.51

- Fix: Support for prisma ^2.20 added (output for generators can now be env vars).
- Feat: Ability to exclude fields and models from the generated GraphQL schema and API using `/// @PrismaAppSync.ignore` ([more details in the docs](https://prisma-appsync.vercel.app/guides/ignore.html)).
- Feat: Simpler boilerplate usage with `yarn create prisma-appsync-app <target-folder>`.
