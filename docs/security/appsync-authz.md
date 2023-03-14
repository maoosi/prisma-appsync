# AppSync Authorization modes

AWS AppSync provides [authz directives ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html) for configuring security and data protection.

::: warning SECURITY MUST NEVER BE TAKEN FOR GRANTED
Prisma-AppSync implements a basic mechanism to help mitigate some common issues. However, accuracy is not guaranteed and you should always test your own API security implementation.
:::

## 👉 Default directive

Using AppSync authorization modes require to set a `defaultDirective` in our `schema.prisma`, that will apply by default to all generated Types.

```prisma{3}
generator appsync {
  provider = "prisma-appsync"
  defaultDirective = "@auth(model: [{ allow: apiKey }])"
}
```

## 👉 Models directives

In addition, it's possible to define Authz directives for individual model definitions using AST comments. Model directives overrides the `defaultDirective`.

```prisma
/// @auth(model: [{ allow: iam }, { allow: apiKey }])
model Post {
  id       Int       @id @default(autoincrement())
  title    String
}
```

## 👉 Usage with @auth syntax

### Supported Authorization modes

<https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html>

```prisma
// API_KEY Authorization
@auth(model: [{ allow: apiKey }])

// AWS_IAM
@auth(model: [{ allow: iam }])

// OPENID_CONNECT
@auth(model: [{ allow: oidc }])

// AMAZON_COGNITO_USER_POOLS
@auth(model: [{ allow: userPools }])

// AMAZON_COGNITO_USER_POOLS with groups
@auth(model: [{ allow: userPools, groups: ["users", "admins"] }])

// Allow multiples
@auth(model: [{ allow: apiKey }, { allow: userPools, groups: ["admins"] }])
```

> **Note:** For now, `@auth` only works with the `model` parameter and the `allow` key.
