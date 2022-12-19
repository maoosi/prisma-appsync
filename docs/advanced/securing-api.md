# 🚨 Securing the API

::: warning IMPORTANT
Security must never be taken for granted. Prisma-AppSync implements a basic mechanism to help mitigate some common issues. However, accuracy is not guaranteed and you should always test your own API security implementation.
:::

## 👉 Data sanitizer (XSS)

By default, Prisma-AppSync will perform XSS sanitization and encode all data coming through the GraphQL API.

**Take a look at this example:**

<table><tr><td width="800px">

1/ Assuming the following GraphQL Input:

```graphql
mutation maliciousPost($title: String!) {
  createPost(data: { title: $title }) {
    title
  }
}
```

```json
{
    "title": "<IMG SRC=\"javascript:alert('XSS');\">"
}
```

</td></tr><tr><td>

2/ Prisma-AppSync will automatically remove the malicious code and encode Html, before storing anything in the database:

| Column name | Value |
| ------------- |:-------------|
| title | `&lt;img src&gt;` |

</td></tr><tr><td>

3/ Finally, the GraphQL API will also automatically clarify (decode) all data before sending the response:

```ts
console.log(post.title) // output: "<img src>"
```

</td></tr></table>

If you prefer to disable data sanitization, set the `sanitize` option to false when instantiating the Client:

```ts
const prismaAppSync = new PrismaAppSync({ sanitize: false })
```

## 👉 In-memory rate limiter (DOS)

By default, Prisma-AppSync will try to protect your Database from most common DOS attacks, by using in-memory rate-limiting.

::: warning DOWNSIDE
Limits are kept in memory and are not shared between function instantiations. This means limits can reset arbitrarily when new instances get spawned or different instances are used to serve requests.
:::

To change the default value (default to 200 requests per user, per minute), you can adjust the `maxReqPerUserMinute` option when instantiating the Client:

```ts
const prismaAppSync = new PrismaAppSync({ maxReqPerUserMinute: 500 })
```

If you prefer to disable the in-memory rate limiter, set the option to false:

```ts
const prismaAppSync = new PrismaAppSync({ maxReqPerUserMinute: false })
```

## 👉 GraphQL query depth

By default, Prisma-AppSync will prevent clients from abusing query depth, by limiting the query complexity.

**For example, it will prevent clients from doing this:**

```graphql
query IAmEvil {
  author(id: "abc") {
    posts {
      author {
        posts {
          author {
            posts {
              author {
                # that could go on as deep as the client wants!
              }
            }
          }
        }
      }
    }
  }
}
```

Default value for the maximum query depth is set to `3`. It is possible to change the default max depth value via the `maxDepth` option:

```ts
const prismaAppSync = new PrismaAppSync({ maxDepth: 4 })
```

## 👉 AppSync Authorization modes

AWS AppSync provides [authz directives ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html) for configuring security and data protection on GraphQL APIs.

Prisma-AppSync enables authz directives directly inside the `schema.prisma` file, via the `defaultDirective` generator option (applies to all generated Types):

```json
generator appsync {
  provider = "prisma-appsync"
  defaultDirective = "@auth(model: [{ allow: iam }, { allow: apiKey }])"
}
```

And/or via AST comments before each model (overrides the default directive):

```json
/// @auth(model: [{ allow: iam }, { allow: apiKey }])
model Post {
  id       Int       @id @default(autoincrement())
  title    String
}
```

| Supported `model` authorization modes: |
|:------------- |
| [API_KEY Authorization ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html#api-key-authorization)<br>`/// @auth(model: [{ allow: apiKey }])` |
| [AWS_IAM ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html#aws-iam-authorization)<br>`/// @auth(model: [{ allow: iam }])` |
| [OPENID_CONNECT ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html#openid-connect-authorization)<br>`/// @auth(model: [{ allow: oidc }])` |
| [AMAZON_COGNITO_USER_POOLS ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html#amazon-cognito-user-pools-authorization)<br>`/// @auth(model: [{ allow: userPools }])` |
| [AMAZON_COGNITO_USER_POOLS ↗](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html#amazon-cognito-user-pools-authorization) using groups<br>`/// @auth(model: [{ allow: userPools, groups: ["users", "admins"] }])`<br> |

## 👉 Fine-grained access control

Prisma-AppSync allows to implementation of fine-grained access control. For example, we might want to only allow access to 'PUBLISHED' posts:

```ts
return await prismaAppSync.resolve({
    event,
    shield: () => {
        // Prisma filtering syntax
        // https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
        const isPublished = { status: { equals: 'PUBLISHED' } }

        return {
            // Micromatch syntax
            // https://github.com/micromatch/micromatch
            'getPost{,/**}': {
                rule: isPublished,
                reason: () => 'Unpublished Posts cannot be accessed.',
            },
        }
    },
})
```

Combining fine-grained access control with [AppSync Authorization modes](#👉-appsync-authorization-modes) allows to implement powerful controls around data.

To illustrate this with a more advanced example, let's assume we want to restrict API access to users logged in via `AMAZON_COGNITO_USER_POOLS` and only allow the owner of a given Post to modify it:

```ts
return await prismaAppSync.resolve({
    event,
    shield: ({ authorization, identity }: QueryParams) => {
        const isCognitoAuth = authorization === Authorizations.AMAZON_COGNITO_USER_POOLS
        const isOwner = { owner: { cognitoSub: identity?.sub } }

        return {
            '**': {
                rule: isCognitoAuth,
                reason: ({ model }) => `${model} access is restricted to logged-in users.`,
            },
            '{update,upsert,delete}Post{,/**}': {
                rule: isOwner,
                reason: ({ model }) => `${model} can only be modified by their owner.`,
            },
        }
    },
})
```

 > The above example implies using Cognito User Pools Authorization. Plus having set up an `Owner` relation on the `Post` model, and a `cognitoSub` field on the `User` model (containing all users `sub`).
