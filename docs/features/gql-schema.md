# Tweaking GraphQL Schema

Prisma-AppSync provides ways to tweak and customise the GraphQL Schema output.

## 👉 Models directives

Tweaking the GraphQL schema for a given model require to write directives via AST comments.

```prisma
/// @gql(mutations: null, subscriptions: null)
model Post {
  id       Int       @id @default(autoincrement())
  title    String
}
```

## 👉 Usage with @gql syntax

### Disable queries, mutations, or subscriptions

```prisma
// Disable all queries, mutations and subscriptions
@gql(model: null)

// Disable all queries (get, list, count, ...)
@gql(queries: null)

// Disable all mutations (create, update, upsert, delete, ...)
@gql(mutations: null)

// Disable all subscriptions (onCreated, onUpdated, ...)
@gql(subscriptions: null)
```

> **Note:** Only top-level rules on queries, mutations and subscriptions are supported.

### Hide fields

```prisma
// If applied to a model with a `password` field:
// hide `password` field from the generated Type
@gql(fields: { password: null })
```

### Rename queries, mutations, or subscriptions

```prisma
// If applied to `Post` model:
// rename default `listPosts` query to `posts`
@gql(queries: { list: "posts" })

// If applied to `Post` model:
// rename default `updatePost` query to `updateThePost`
@gql(mutations: { update: "updateThePost" })

// If applied to `Post` model:
// rename default `onCreatedPost` query to `afterCreatedPost`
@gql(subscriptions: { onCreated: "afterCreatedPost" })
```

> **Note:** Only queries, mutations and subscriptions can be renamed.

### Custom fields Scalars

```prisma
// If applied to a model with a `website` (string) field:
// use scalar `AWSURL` instead of default `String`
@gql(scalars: { website: "AWSURL" })
```
