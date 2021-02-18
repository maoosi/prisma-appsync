<p align="center">
    <img width="250" height="250" src="prisma-appsync-logo.png" alt="Prisma-AppSync" />
</p>

# Prisma-AppSync &middot; [![Generic badge](https://img.shields.io/badge/Generator%20for-Prisma%202-9F7AEA.svg)](https://www.prisma.io) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/maoosi/prisma-appsync/graphs/commit-activity)

**Prisma-AppSync** is a custom [Prisma 2.0](https://www.prisma.io) generator that automatically spawns code of a fully working GraphQL CRUD API, designed for AWS AppSync.

> ⚠️ ⚠️ Prisma-AppSync is highly experimental and it is not recommended to use in Production at this stage. Feedback, suggestions and PRs welcomed.

## ✨ Automatically generated

- **GraphQL Schema:** Designed to work with AWS AppSync scalar types and directives.
- **Client:** Prisma Client on steroids, that can handle CRUD operations out-of-the-box.
- **API Docs:** Documentation for the GraphQL CRUD API ([see example](/demo/post.html)).

## ✔️ Features

- AppSync CRUD API (get/list/create/update/delete/deleteMany).
- Extensible TypeScript Class with support for hooks and custom resolvers.
- Support for AppSync authorization modes, as well as fine-grained access control.
- Real-time subscriptions (onCreated/onUpdated/onDeleted).
- Exposes Prisma relation queries (create/connect/connectOrCreate/update/upsert/delete/disconnect/set/updateMany/deleteMany).
- Full CloudWatch logs for easy debugging on AWS.
- XSS data sanitization by default.

## ⚓ Compatibility

- Prisma 2.16.1

## 📓 Documentation

[Read the documentation](https://prisma-appsync.vercel.app) to get started with Prisma-AppSync.

## 🎬 Getting started video

[![Getting started with Prisma-AppSync](prisma-appsync-video.png)](http://www.youtube.com/watch?v=v9wIJ02lLG0 "Getting started with Prisma-AppSync")

## 🧙‍♂️ Contributors

<table>
      <tr>
        <td align="center"><a href="https://github.com/maoosi"><img src="https://avatars2.githubusercontent.com/u/4679377?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Sylvain S.</b></sub></a></td>
    </tr>
</table>
