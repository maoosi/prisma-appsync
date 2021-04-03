---
sidebarDepth: 0
---

# Excluding data from the schema and API

- 👉 [Excluding fields](#👉-excluding-fields)
- 👉 [Excluding models](#👉-excluding-models)

> **Exposing your data model directly to the public is not a good practice.** By design, Prisma-AppSync generates the GraphQL schema and API based on the data model defined in the `schema.prisma` file and therefore exposes the entire data model by default.

To counter this, Prisma-AppSync offers three options:

1. [Extending the API with custom types and resolvers.](/guides/extending-api.html)
2. [Securing the API using AppSync Authorization modes and Fine-Grained Access Control around data.](/guides/securing-api.html)
3. [Excluding data fields and models from the GraphQL schema output and API.](#👉-excluding-fields)

## 👉 Excluding fields

To exclude the `password` field from the GraphQL schema output and API, simply use the `@PrismaAppSync.ignore` directive within the `prisma.schema` file:

```graphql{5}
model User {
    id              Int         @id @default(autoincrement())
    username        String      @unique

    /// @PrismaAppSync.ignore
    password        String
}
```

## 👉 Excluding models

To exclude the `User` model entirely from the GraphQL schema output and API, simply use the `@PrismaAppSync.ignore` directive within the `prisma.schema` file:

```graphql{1}
/// @PrismaAppSync.ignore
model User {
    id              Int         @id @default(autoincrement())
    username        String      @unique
    password        String
}
```
