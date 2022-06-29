# 🚪 Securing the API

::: warning IMPORTANT
Security must never be taken for granted. Prisma-AppSync implements basic mechanism to help mitigate some common issues. However, accuracy is not guaranteed and you should always test your own API security implementation.
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

2/ Prisma-AppSync will automatically remove the malicious code and encode html, before storing anything into the database:

| Column name | Value |
| ------------- |:-------------|
| title | `&lt;img src&gt;` |

</td></tr><tr><td>

3/ Finally, the GraphQL API will also automatically clarify (decode) all data before sending the response:

```ts
console.log(post.title) // output: "<img src>"
```

</td></tr></table>

If you prefer to disable data sanitization, simply set the `sanitize` option to false when instantiating the Client:

```ts
const prismaAppSync = new PrismaAppSync({ sanitize: false })
```

## 👉 In-memory rate limiter (DOS)

By default, Prisma-AppSync will try to protect your Database from most common DOS attacks, by using in-memory rate-limiting.

::: warning DOWNSIDE
Limits are kept in-memory and are not shared between function instantiations. This means limits can reset arbitrarily when new instances get spawned or different instances are used to serve requests.
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

::: info IN PROGRESS
Documentation coming soon...
:::

## 👉 Fine-Grained Access Control

::: info IN PROGRESS
Documentation coming soon...
:::