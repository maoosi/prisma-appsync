# Tweaking GraphQL Schema

Prisma-AppSync provides ways to tweak and customise the GraphQL Schema output.

## 👉 Models directives

Tweaking the GraphQL schema for a given model require to write directives via AST comments (triple-slash `///`).

```prisma
/// @gql(mutations: null, subscriptions: null)
/// @gql(fields: { password: null })
/// @gql(scalars: { email: "AWSEmail" })
model User {
  id       Int       @id @default(autoincrement())
  email    String
  password String
}
```

## 👉 Usage with @gql syntax

### Disabling an entire model

```prisma
// Disable all queries, mutations and subscriptions
@gql(model: null)
```

### Disabling queries

```prisma
// Disable all queries (get, list, count, ...)
@gql(queries: null)

// Disable granular queries
@gql(queries: { list: null, count: null })
```

### Disabling mutations

```prisma
// Disable all mutations (create, update, upsert, delete, ...)
@gql(mutations: null)

// Disable granular mutations
@gql(mutations: { update: null, delete: null })
```

> **Cascading Rules:**
>
> - Disabling `update` **will also disable** `upsert`
> - Disabling `create` **will also disable** `upsert`
> - Disabling `mutations` **will also disable** `subscriptions`

### Disabling subscriptions

```prisma
// Disable all subscriptions (onCreated, onUpdated, ...)
@gql(subscriptions: null)

// Disable granular subscriptions
@gql(mutations: { onCreated: null, onUpdated: null })
```

### Hiding fields

```prisma
// If applied to a model with a `password` field:
// hide `password` field from the generated Type
@gql(fields: { password: null })
```

> **Note:** To maintain Prisma Client integrity, hidden fields remain writable in mutation operations.

### Custom scalars on fields

```prisma
// If applied to a model with a `website` (string) field:
// use scalar `AWSURL` instead of default `String`
@gql(scalars: { website: "AWSURL" })
```
