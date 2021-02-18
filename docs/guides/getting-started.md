---
sidebarDepth: 0
---

# Getting started

::: danger

Prisma-AppSync is highly experimental and it is not recommended to use in Production at this stage. Feedback, suggestions and PRs welcomed.
:::

## 🧐 Introduction

The goal of **Prisma-AppSync** is to make the process of creating GraphQL API's easier and quicker, while still keeping scalability, security and extensibility at the center.

[diagram coming soon]

Even though it is provided as a single Prisma Generator package, **Prisma-AppSync** could be broken down to 3 core elements:

- **Prisma-AppSync Client**, a TypeScript client (think of it as Prisma Client on steroids) ready to use within the API resolver function. Capable to handle CRUD operations with a single line of code, it also give access to advanced features for securing, extending and customising the API.

- **Prisma-AppSync Generator**, who's role is to parse the `prisma.schema` file, generate the Client, generate files for AWS AppSync (Schema + Resolver mapping settings), and generate the API documentation.

- **Prisma-AppSync Boilerplate**, made of an AWS CDK template and a sample Lambda Function (Direct Lambda Resolver for AppSync), both designed to help get started with integration and deployement.

## ❓ Why?

**Why Prisma?**

- Open-source, really active community, and a full-time team of developers.
- Best-in-class developers' experience to interact with and manage data.
- Growing ecosystem with Prisma Client (ORM), Prisma Migrate (migration system) and Prisma Studio (GUI).
- Work with multiple data sources (MySQL, PostgreSQL, SQLite, SQL Server).
- Single source of truth for modeling data using a `Prisma.schema` file.

**Why AWS AppSync?**

- Allows to build robust and fully managed GraphQL APIs (Serverless).
- Highly available and scalable by nature, while also really cost effective to run.
- Real-time subscriptions, offline capabilities and caching out-of-the-box.
- Secure data-access and advanced multi-authorization patterns.