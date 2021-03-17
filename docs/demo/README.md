---
sidebarDepth: 0
---

# Demo

## 👉 `schema.prisma` input

```graphql
datasource db {
    provider = "mysql"
    url      = env("DATABASE_URL")
}

generator client {
    provider = "prisma-client-js"
    binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

generator appsync {
    provider = "prisma-appsync"
}

model User {
    id         Int      @id @default(autoincrement())
    username   String   @unique
    email      String   @unique
    role       Role     @default(USER)
    posts      Post[]
}

model Post {
    id         Int      @id @default(autoincrement())
    title      String
    author     User?    @relation(fields: [authorId], references: [id])
    authorId   Int?
    published  Boolean  @default(false)
}

enum Role {
    USER
    ADMIN
}
```

## 👉 Generator output

```shell
.
+-- generated
|   +-- prisma-appsync
|   |   +-- client/ # API client Class
|   |   +-- docs/ # API Docs
|   |   +-- resolvers.yaml # AppSync Resolvers
|   |   +-- schema.gql # AppSync GQL Schema
```

## 👉 AppSync schema output

::: details Click here to see the `schema.gql` content output

```graphql
type User {
    id: Int!
    username: String!
    email: AWSEmail!
    role: Role!
    posts: [Post]
}

type Post {
    id: Int!
    title: String!
    author: User
    published: Boolean!
}

type BatchPayload {
    count: Int
}

enum Role {
    USER
    ADMIN
}

enum OrderByArg {
    ASC
    DESC
}

input UserPostsCreateRelations {
    create: [PostCreateInput]
    connect: [PostWhereUniqueInput]
    connectOrCreate: [PostConnectOrCreateInput]
}

input PostAuthorCreateRelations {
    create: UserCreateInput
    connect: UserWhereUniqueInput
    connectOrCreate: UserConnectOrCreateInput
}

input UserPostsUpdateRelations {
    create: [PostCreateInput]
    connect: [PostWhereUniqueInput]
    connectOrCreate: [PostConnectOrCreateInput]
    update: [PostUpdateUniqueInput]
    upsert: [PostUpsertUniqueInput]
    delete: [PostDeleteUniqueInput]
    disconnect: [PostWhereUniqueInput]
    set: [PostWhereUniqueInput]
    updateMany: [PostUpdateManyInput]
    deleteMany: [PostDeleteManyInput]
}

input PostAuthorUpdateRelations {
    create: UserCreateInput
    connect: UserWhereUniqueInput
    connectOrCreate: UserConnectOrCreateInput
    update: UserUpdateInput
    upsert: UserUpsertInput
    delete: Boolean
    disconnect: Boolean
}

input UserDeleteUniqueInput {
    where: UserWhereUniqueInput!
}

input PostDeleteUniqueInput {
    where: PostWhereUniqueInput!
}

input UserDeleteManyInput {
    where: UserWhereInput!
}

input PostDeleteManyInput {
    where: PostWhereInput!
}

input UserConnectOrCreateInput {
    where: UserWhereUniqueInput!
    create: UserCreateInput!
}

input PostConnectOrCreateInput {
    where: PostWhereUniqueInput!
    create: PostCreateInput!
}

input UserUpdateUniqueInput {
    data: UserUpdateInput!
    where: UserWhereUniqueInput!
}

input PostUpdateUniqueInput {
    data: PostUpdateInput!
    where: PostWhereUniqueInput!
}

input UserUpdateManyInput {
    data: UserUpdateInput!
    where: UserWhereInput!
}

input PostUpdateManyInput {
    data: PostUpdateInput!
    where: PostWhereInput!
}

input UserUpsertInput {
    create: UserCreateInput!
    update: UserUpdateInput!
}

input PostUpsertInput {
    create: PostCreateInput!
    update: PostUpdateInput!
}

input UserUpsertUniqueInput {
    where: UserWhereUniqueInput!
    create: UserCreateInput!
    update: UserUpdateInput!
}

input PostUpsertUniqueInput {
    where: PostWhereUniqueInput!
    create: PostCreateInput!
    update: PostUpdateInput!
}

input UserCreateInput {
    username: String!
    email: AWSEmail!
    role: Role!
    posts: UserPostsCreateRelations
}

input PostCreateInput {
    title: String!
    author: PostAuthorCreateRelations
    authorId: Int
    published: Boolean!
}

input UserUpdateInput {
    username: String
    email: AWSEmail
    role: Role
    posts: UserPostsUpdateRelations
}

input PostUpdateInput {
    title: String
    author: PostAuthorUpdateRelations
    authorId: Int
    published: Boolean
}

input UserWhereInput {
    OR: [UserWhereInput]
    NOT: [UserWhereInput]
    AND: [UserWhereInput]
    id: Int
    id_equals: Int
    id_not: Int
    id_lt: Int
    id_lte: Int
    id_gt: Int
    id_gte: Int
    id_contains: Int
    id_startsWith: Int
    id_endsWith: Int
    username: String
    username_equals: String
    username_not: String
    username_lt: String
    username_lte: String
    username_gt: String
    username_gte: String
    username_contains: String
    username_startsWith: String
    username_endsWith: String
    email: AWSEmail
    email_equals: AWSEmail
    email_not: AWSEmail
    email_lt: AWSEmail
    email_lte: AWSEmail
    email_gt: AWSEmail
    email_gte: AWSEmail
    email_contains: AWSEmail
    email_startsWith: AWSEmail
    email_endsWith: AWSEmail
    role: Role
    role_equals: Role
    role_not: Role
    role_lt: Role
    role_lte: Role
    role_gt: Role
    role_gte: Role
    role_contains: Role
    role_startsWith: Role
    role_endsWith: Role
    posts: PostWhereInput
}

input PostWhereInput {
    OR: [PostWhereInput]
    NOT: [PostWhereInput]
    AND: [PostWhereInput]
    id: Int
    id_equals: Int
    id_not: Int
    id_lt: Int
    id_lte: Int
    id_gt: Int
    id_gte: Int
    id_contains: Int
    id_startsWith: Int
    id_endsWith: Int
    title: String
    title_equals: String
    title_not: String
    title_lt: String
    title_lte: String
    title_gt: String
    title_gte: String
    title_contains: String
    title_startsWith: String
    title_endsWith: String
    author: UserWhereInput
    authorId: Int
    authorId_equals: Int
    authorId_not: Int
    authorId_lt: Int
    authorId_lte: Int
    authorId_gt: Int
    authorId_gte: Int
    authorId_contains: Int
    authorId_startsWith: Int
    authorId_endsWith: Int
    published: Boolean
    published_equals: Boolean
    published_not: Boolean
    published_lt: Boolean
    published_lte: Boolean
    published_gt: Boolean
    published_gte: Boolean
    published_contains: Boolean
    published_startsWith: Boolean
    published_endsWith: Boolean
}

input UserWhereUniqueInput {
    id: Int

    username: String

    email: AWSEmail
}

input PostWhereUniqueInput {
    id: Int

    authorId: Int
}

input UserOrderByInput {
    id: OrderByArg
    username: OrderByArg
    email: OrderByArg
    role: OrderByArg
}

input PostOrderByInput {
    id: OrderByArg
    title: OrderByArg
    published: OrderByArg
}

type Mutation {
    createUser(data: UserCreateInput!): User
    updateUser(
        data: UserUpdateInput!
        where: UserWhereUniqueInput!
    ): User
    upsertUser(
        data: UserUpdateInput!
        where: UserWhereUniqueInput!
    ): User
    deleteUser(where: UserWhereUniqueInput!): User
    deleteManyUsers(where: UserWhereInput!): BatchPayload

    createPost(data: PostCreateInput!): Post
    updatePost(
        data: PostUpdateInput!
        where: PostWhereUniqueInput!
    ): Post
    upsertPost(
        data: PostUpdateInput!
        where: PostWhereUniqueInput!
    ): Post
    deletePost(where: PostWhereUniqueInput!): Post
    deleteManyPosts(where: PostWhereInput!): BatchPayload
}

type Query {
    getUser(where: UserWhereUniqueInput!): User
    listUsers(
        where: UserWhereInput
        orderBy: UserOrderByInput
    ): [User]

    getPost(where: PostWhereUniqueInput!): Post
    listPosts(
        where: PostWhereInput
        orderBy: PostOrderByInput
    ): [Post]
}

type Subscription {
    onCreatedUser(
        id: Int

        username: String

        email: AWSEmail
    ): User @aws_subscribe(mutations: ["createUser"])
    onUpdatedUser(
        id: Int

        username: String

        email: AWSEmail
    ): User @aws_subscribe(mutations: ["updateUser"])
    onDeletedUser(
        id: Int

        username: String

        email: AWSEmail
    ): User @aws_subscribe(mutations: ["deleteUser"])

    onCreatedPost(
        id: Int

        authorId: Int
    ): Post @aws_subscribe(mutations: ["createPost"])
    onUpdatedPost(
        id: Int

        authorId: Int
    ): Post @aws_subscribe(mutations: ["updatePost"])
    onDeletedPost(
        id: Int

        authorId: Int
    ): Post @aws_subscribe(mutations: ["deletePost"])
}

```

:::

## 👉 API docs output

Prisma-AppSync automatically generate the following API docs (specs):

- [User Type](/demo/user.html)
- [Post Type](/demo/post.html)
