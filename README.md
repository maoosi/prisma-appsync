<p align="center">
    <img width="250" height="250" src="https://prisma-appsync.vercel.app/prisma-appsync-logo.png" alt="Prisma-AppSync" />
</p>

# Prisma-AppSync &middot; [![Generic badge](https://img.shields.io/badge/Generator%20for-◭%20Prisma%202-9F7AEA.svg)](https://www.prisma.io) [![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/maoosi/prisma-appsync/graphs/commit-activity)

**Prisma-AppSync** is a custom Generator for [Prisma 2](https://www.prisma.io), that automatically generates a fully working AWS AppSync ⚡ GraphQL CRUD API.

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

[![Getting started with Prisma-AppSync](https://prisma-appsync.vercel.app/prisma-appsync-video.png)](http://www.youtube.com/watch?v=v9wIJ02lLG0 "Getting started with Prisma-AppSync")

## 🧙‍♂️ Contributors

<table>
      <tr>
        <td align="center" style="border:0;">
            <a href="https://github.com/maoosi" target="_blank">
                <img src="https://avatars2.githubusercontent.com/u/4679377?v=3?s=120" width="120px;" alt="maoosi"/>
                <br /><sub><b>Sylvain (maoosi)</b></sub>
            </a>
        </td>
    </tr>
</table>

## 🤟 Sponsors

<table>
      <tr>
        <td align="center" style="border:0;width:200px;">
            <a href="https://travistravis.co" target="_blank">
                <img src="https://prisma-appsync.vercel.app/travistravis.co.png" width="160px;" alt="travistravis.co"/>
                <br /><b>Travis</b>
                <br /><sub style="line-height: 0;vertical-align: baseline;">Travis makes travel planning visual, social and collaborative.</sub>
            </a>
        </td>
    </tr>
</table>