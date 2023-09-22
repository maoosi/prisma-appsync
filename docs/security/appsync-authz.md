# AppSync Authorization modes

AWS AppSync provides [authz directives ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html) for configuring security and data protection.

::: warning SECURITY MUST NEVER BE TAKEN FOR GRANTED
Prisma-AppSync implements a basic mechanism to help mitigate some common issues. However, accuracy is not guaranteed and you should always test your own API security implementation.
:::

## 👉 Models directives

Applying AppSync authorization modes for a given model require to write directives using AST comments (triple-slash `///`).

```prisma
/// @auth(model: [{ allow: iam }, { allow: apiKey }])
model Post {
  id       Int       @id @default(autoincrement())
  title    String
}
```

## 👉 Usage with @auth syntax

> **Note:** For now, `@auth` only works supports the `allow` key.

### Entire model

```prisma
// Apply to all queries, mutations and subscriptions
@auth(model: [{ allow: iam }])
```

### Queries

```prisma
// Apply to all queries (get, list, count, ...)
@auth(queries: [{ allow: iam }])

// Apply to granular queries
@auth(queries: { list: [{ allow: iam }] })
```

### Mutations

```prisma
// Apply to all mutations (create, update, upsert, delete, ...)
@auth(mutations: [{ allow: iam }])

// Apply to granular mutations
@auth(mutations: { create: [{ allow: iam }] })
```

### Subscriptions

```prisma
// Apply to all subscriptions (onCreated, onUpdated, ...)
@auth(subscriptions: [{ allow: iam }])

// Apply to granular subscriptions
@auth(subscriptions: { onCreated: [{ allow: iam }] })
```

## 👉 Supported Authorization modes

<https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html>

```prisma
// API_KEY Authorization
@auth(model: [{ allow: apiKey }])

// AWS_IAM
@auth(model: [{ allow: iam }])

// OPENID_CONNECT
@auth(model: [{ allow: oidc }])

// AWS_LAMBDA
@auth(model: [{ allow: lambda }])

// AMAZON_COGNITO_USER_POOLS
@auth(model: [{ allow: userPools }])

// AMAZON_COGNITO_USER_POOLS with groups
@auth(model: [{ allow: userPools, groups: ["users", "admins"] }])

// Allow multiples
@auth(model: [{ allow: apiKey }, { allow: userPools, groups: ["admins"] }])
```

## 👉 Default directive

It is also possible to set a `defaultDirective`, that will apply to all generated Types:

```prisma{3}
generator appsync {
  provider = "prisma-appsync"
  defaultDirective = "@auth(model: [{ allow: apiKey }])"
}
```

Prisma-AppSync will automatically merge the `defaultDirective` with model directives:

```prisma
// defaultDirective
@auth(model: [{ allow: iam }])

// model directive
@auth(model: [{ allow: apiKey }])

// merge applied to model
@auth(model: [{ allow: iam }, { allow: apiKey }])
```
