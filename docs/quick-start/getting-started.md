# Getting started

**Prisma-AppSync** seamlessly transforms your [Prisma Schema](https://www.prisma.io) into a comprehensive GraphQL&#160;API, tailored for [AWS AppSync](https://aws.amazon.com/appsync/).

<table><tr><td width="500px" valign="top">

**From `schema.prisma`:**

```prisma
model Post {
    id         Int
    title      String
}
```

</td><td width="500px">

**To full-blown GraphQL API:**

```graphql
query list {
  listPosts {
    id
    title
  }
}
```

</td></tr></table>

## 👉 Features

💎 **Use your ◭ Prisma Schema**<br/>Quickly define your data model and deploy a GraphQL API tailored for AWS AppSync.

⚡️ **Auto-generated CRUD operations**<br/>Using Prisma syntax, with a robust TS Client designed for AWS Lambda Resolvers.

⛑ **Pre-configured security**<br/>Built-in XSS protection, query depth limitation, and in-memory rate limiting.

🔐 **Fine-grained ACL and authorization**<br/>Flexible security options such as API keys, IAM, Cognito, and more.

🔌 **Fully extendable features**<br/>Customize your GraphQL schema, API resolvers, and data flow as needed.

## 👉 Built around 4 packages

<table>
<tr>
<td width="800px">

**`packages/generator`**

Generator for [Prisma ORM](https://www.prisma.io/), whose role is to parse your Prisma Schema and generate all the necessary components to run and deploy a GraphQL API tailored for AWS AppSync.

</td>
</tr>
<tr>
<td>

**`packages/client`**

Think of it as [Prisma Client](https://www.prisma.io/client) for GraphQL. Fully typed and designed for AWS Lambda AppSync Resolvers. It can handle CRUD operations with just a single line of code, or be fully extended.

</td>
</tr>
<tr>
<td>

**`packages/installer`**

Interactive CLI tool that streamlines the setup of new Prisma-AppSync projects, making it as simple as running `npx create-prisma-appsync-app@latest`.

</td>
</tr>
<tr>
<td>

**`packages/server`**

Local dev environment that mimics running Prisma-AppSync in production. It includes an AppSync simulator, local Lambda resolvers execution, a GraphQL IDE, hot-reloading, and authorizations.

</td>
</tr>
</table>
