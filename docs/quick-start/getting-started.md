# Getting started

**Prisma-AppSync** is a [Prisma](https://www.prisma.io) Generator, that instantly converts your Schema into a full-blown GraphQL&#160;API for [AWS AppSync](https://aws.amazon.com/appsync/).

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

- 💎 **Utilize ◭ Prisma Schema** to define data structure and quickly spin up a GraphQL API.
- ⚡️ **Auto-generated CRUD operations**, fully customisable and using Prisma syntax.
- ⛑ **Built-in, zero-config** XSS data sanitization, query depth control and rate limiting.
- 🔐 **Fine-grained access control and authorization** modes (API key, IAM, Cognito, etc).
- 🔌 **Fully extensible** GQL schema and TS Client API to add custom hooks and resolvers.

## 👉 Built around 4 packages

<table>
<tr>
<td width="800px">

**`packages/generator`**

Generator for [Prisma ORM](https://www.prisma.io/), whose role is to parse `schema.prisma` and generate a fully typed Client (written in TypeScript for AWS Lambda), plus all the files required to run and deploy a GraphQL API on AWS AppSync (Schema + Resolver mapping).

</td>
</tr>
<tr>
<td>

**`packages/client`**

Think of it as [Prisma Client](https://www.prisma.io/client) on steroids 💪. Fully typed, written in TypeScript for AWS Lambda AppSync resolvers, and capable to handle CRUD operations with a single line of code. It also allows extending and customising the GraphQL API.

</td>
</tr>
<tr>
<td>

**`packages/installer`**

Interactive scaffolding CLI to quickly start new Prisma-AppSync projects, accessible from a single `npx create-prisma-appsync-app@latest` command. It can also plug into existing projects already using Prisma.

</td>
</tr>
<tr>
<td>

**`packages/server`**

Local development environment built for Prisma-AppSync (local database, auto-reload, TS support, GraphQL IDE). Simulate a GraphQL API running on AWS AppSync + AWS Lambda Resolver + Prisma ORM + Database.

</td>
</tr>
</table>
