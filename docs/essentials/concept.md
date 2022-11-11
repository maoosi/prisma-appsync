# 🦄 Concept

**Prisma-AppSync** is a [Prisma](https://www.prisma.io) Generator, that instantly converts your Schema into a full-blown ⚡ GraphQL API for [AWS AppSync](https://aws.amazon.com/appsync/).

## 👉 Why Prisma-AppSync?

**Prisma-AppSync** was built with the intent to speed up GraphQL API development while benefiting from both the incredible [Prisma ORM](https://www.prisma.io) Developer Experience and the power of [AWS AppSync](https://aws.amazon.com/appsync/) fully managed GraphQL service.

To deliver on its promise, **Prisma-AppSync** uses [Prisma Schema](https://www.prisma.io/migrate) files as a source of truth to automatically generate GraphQL APIs, with out-of-the-box CRUD operations, and config to instantly deploy serverless on AWS.

**Here are some key features that make using Prisma-AppSync a breeze:**

<table><tr><td width="800px">
💎 Uses Prisma Schema to define data structure and quickly spin up a GraphQL API.
</td></tr><tr><td>
⚡️ Auto-generated CRUD operations, fully customisable and using Prisma syntax.
</td></tr><tr><td>
⛑ Built-in, zero-config XSS data sanitization, query depth control and rate limiting.
</td></tr><tr><td>
🔐 Fine-grained access control and authorization modes (API key, IAM, Cognito, etc).
</td></tr><tr><td>
🔌 Fully extensible GQL schema and TS Client API to add custom hooks and resolvers.
</td></tr></table>

## 👉 Under the hood

<table>
<tr>
<td width="800px">

### ◭ Prisma-AppSync [ Generator ]

Generator for [Prisma ORM](https://www.prisma.io/), whose role is to parse `schema.prisma` and generate a fully typed Client (written in TypeScript for AWS Lambda), plus all the files required to run and deploy a GraphQL API on AWS AppSync (Schema + Resolver mapping).

</td>
</tr>
<tr>
<td>

### ◭ Prisma-AppSync [ Client ]

Think of it as [Prisma Client](https://www.prisma.io/client) on steroids 💪. Fully typed, written in TypeScript for AWS Lambda AppSync resolvers, and capable to handle CRUD operations with a single line of code. It also allows extending and customising the GraphQL API.

</td>
</tr>
<tr>
<td>

### ◭ Prisma-AppSync [ Installer ]

Interactive scaffolding CLI to quickly start new Prisma-AppSync projects, accessible from a single `npx create-prisma-appsync-app@latest` command. It can also plug into existing projects already using Prisma.

</td>
</tr>
<tr>
<td>

### ◭ Prisma-AppSync [ Server ]

Local development environment built for Prisma-AppSync (local database, auto-reload, TS support, GraphQL IDE). Simulate a GraphQL API running on AWS AppSync + AWS Lambda Resolver + Prisma ORM + Database.

</td>
</tr>
</table>
