---
sidebarDepth: 0
---

# Getting started

## 🏃 Want to jump right in?

[Follow the Installation guide](/guides/installation.html)

## 🧐 Under the hood

**Prisma-AppSync** can be broken down to 3 core elements:

- <span style="color:#557af4;">**Prisma-AppSync Generator**</span>, who's role is to parse the `schema.prisma` file, generate the Client, generate files for AWS AppSync (Schema + Resolver mapping settings), and generate the API documentation.

- <span style="color:#f59837;">**Prisma-AppSync Client**</span>, a TypeScript client (think of it as Prisma Client on steroids) ready to use within the API resolver function. Capable to handle CRUD operations with a single line of code, it also give access to advanced features for securing, extending and customising the API.

- <span style="color:#02b414;">**Prisma-AppSync Boilerplate**</span>, a starter kit made of an AWS CDK template and a sample Lambda Function (Direct Lambda Resolver for AppSync), both designed to help get started with integration and deployement.

![Architecture diagram](/prisma-appsync-diagram.png)

## ❓ Why?

**Why Prisma?**

- Open-source, really active community, and a full-time team of developers.
- Best-in-class developers' experience to interact with and manage data.
- Growing ecosystem with Prisma Client (ORM), Prisma Migrate (migration system) and Prisma Studio (GUI).
- Work with multiple data sources (MySQL, PostgreSQL, SQLite, SQL Server, MongoDB).
- Single source of truth for modeling data using a `schema.prisma` file.

**Why AWS AppSync?**

- Allows to build robust and fully managed GraphQL APIs (Serverless).
- Highly available and scalable by nature, while also really cost effective to run.
- Real-time subscriptions, offline capabilities and caching out-of-the-box.
- Secure data-access and advanced multi-authorization patterns.

## 🗺️ Roadmap

- Support more Prisma features (orderBy relations, aggregate queries, ...)
- Work on security (refactor access-control system, protect n+1 queries, ...)
- Refactor and expand testing coverage to progress towards stable.

[See full list here](https://github.com/maoosi/prisma-appsync/projects/1)
