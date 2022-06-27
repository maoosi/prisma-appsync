# 🦄 Concept

## 👉 Why Prisma-AppSync?

### 4 reasons why you should consider using Prisma-AppSync:

1. **Drastically improve development velocity** by auto-generating the API from a single Prisma Schema file, yet still giving you the flexibility to customise everything you need. You can literally [build a fully working GraphQL API in under 10 minutes ↗](https://www.youtube.com/watch?v=k2tjpxC7mrQ).
2. **Reduces the maintenance burden** of managing your own GraphQL Server and API Layer by using fully managed GraphQL and Serverless. Instead, you can fully focus on building your core business logic.
3. **Leverage all the features offered by AWS AppSync**, including multiple data-sources, real-time subscriptions, offline capabilities, queries caching, advanced multi-authorizations patterns, high availability and scalability.
4. **Benefits from the same developer experience Prisma offers**, and get access the ever growing open-source community and ecosystem. Prisma-AppSync also comes with [Sponsors priority support ↗](https://github.com/sponsors/maoosi) for whoever needs it.

## 👉 Under the hood

**Prisma-AppSync** is built around two major parts:

- **Prisma-AppSync [Generator]**, who's role is to parse your `schema.prisma` and generate a TS Client (to use within Lambda) along with the AWS AppSync config files required to run your GraphQL API (Schema + Resolver mapping).
- **Prisma-AppSync [Client]**, a TypeScript client (think of it as Prisma Client on steroids 💪) ready to use within Lambda (API resolver function for AWS AppSync). Capable to handle CRUD operations with a single line of code, it also give access to advanced features for extending and customising your GraphQL API.
