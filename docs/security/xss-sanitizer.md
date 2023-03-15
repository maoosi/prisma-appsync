# XSS sanitizer

## 👉 Usage

Prisma-AppSync automatically perform XSS sanitization and encode all data coming through the GraphQL API.

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

## 👉 Disable xss sanitization

If you prefer to disable data sanitization, set the `sanitize` option to false when instantiating the Client:

```ts
const prismaAppSync = new PrismaAppSync({ sanitize: false })
```
