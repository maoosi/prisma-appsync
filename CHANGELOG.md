# Changelog

## Version 1.0.0-beta.58

### (Breaking) Fix: Issue linked to Prisma models naming

Using a model name format other than PascalCase OR already in the plural form, was causing mapping issues between GraphQL queries and Prisma Client.

> Only breaking in case you were NOT following PascalCase naming convention for models OR affected by one of the below examples.

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

### Feat: New Queries, Mutations and Subscriptions added

- Query **count** (e.g. `countPosts`).
- Mutation **createMany** (e.g. `createManyPosts`).
- Mutation **updateMany** (e.g. `updateManyPosts`).
- Subscription **onUpserted** (e.g. `onUpsertedPost`): Triggered on `create`, `update`, or `upsert` mutation.
- Subscription **onMutated** (e.g. `onMutatedPost`): Triggered on `create`, `update`, `upsert`, or `delete` mutation.

### Misc

- Boilerplate updated to work with new changes listed above.
- Upgraded Prisma to v2.25.0.

## Version 1.0.0-beta.57

- Feat: Support for prisma ^2.24.1 added.
- Fix: Type issue in the Boilerplate.

## Version 1.0.0-beta.56

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

## Version 1.0.0-beta.53

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

## Version 1.0.0-beta.52

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

## Version 1.0.0-beta.51

- Fix: Support for prisma ^2.20 added (output for generators can now be env vars).
- Feat: Ability to exclude fields and models from the generated GraphQL schema and API using `/// @PrismaAppSync.ignore` ([more details in the docs](https://prisma-appsync.vercel.app/guides/ignore.html)).
- Feat: Simpler boilerplate usage with `yarn create prisma-appsync-app <target-folder>`.
