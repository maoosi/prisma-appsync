---
sidebarDepth: 0
---

# Post Type

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `Post` type.

| Field     | Kind         | Scalar Type | Unique   | Required (create) |
| --------- | ------------ | ----------- | -------- | ----------------- |
| id        | scalar       | Int         | **true** | **true**          |
| title     | scalar       | String      | false    | **true**          |
| author    | **relation** | User        | false    | false             |
| published | scalar       | Boolean     | false    | **true**          |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getPost`: Read a single post.
-   `listPosts`: Read multiple posts.

### Querying a single post

Single post queries can take one input:

-   `where`: `PostWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getPost(where: { id: 2 }) {
        id
        title
        author # One-to-one relation
        published
    }
}
```

### Querying multiple posts

Multiple posts queries can take two inputs:

-   `where`: `PostWhereInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `PostOrderByInput` An optional object type to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.

**Standard query**

```graphql
query {
    listPosts {
        id
        title
        author # One-to-one relation
        published
    }
}
```

**Standard query with where**

```graphql
query {
    listPosts(where: { title: "Foo" }) {
        id
        title
        author # One-to-one relation
        published
    }
}
```

**Advanced query using filters**

<details><summary>List of all filters available</summary>
<p>

```graphql
getid: Int
    id_equals: Int
    id_not: Int
    id_lt: Int
    id_lte: Int
    id_gt: Int
    id_gte: Int
    id_contains: Int
    id_startsWith: Int
    id_endsWith: Int
gettitle: String
    title_equals: String
    title_not: String
    title_lt: String
    title_lte: String
    title_gt: String
    title_gte: String
    title_contains: String
    title_startsWith: String
    title_endsWith: String
getauthorId: Int
    authorId_equals: Int
    authorId_not: Int
    authorId_lt: Int
    authorId_lte: Int
    authorId_gt: Int
    authorId_gte: Int
    authorId_contains: Int
    authorId_startsWith: Int
    authorId_endsWith: Int
getpublished: Boolean
    published_equals: Boolean
    published_not: Boolean
    published_lt: Boolean
    published_lte: Boolean
    published_gt: Boolean
    published_gte: Boolean
    published_contains: Boolean
    published_startsWith: Boolean
    published_endsWith: Boolean

```

</p>
</details>

```graphql
query {
    listPosts(where: { title_startsWith: "Foo" }) {
        author # One-to-one relation
        authorId
    }
}
```

**Standard query with orderBy**

```graphql
query {
    listPosts(orderBy: { title: DESC }) {
        id
        title
        author # One-to-one relation
        published
    }
}
```

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createPost`: Create a single post.
-   `updatePost`: Update a single post.
-   `upsertPost`: Update existing OR create single post.
-   `deletePost`: Delete a single post.
-   `deleteManyPosts`: Delete multiple posts.

### Creating a single post

Single post create mutations can take one input:

-   `data`: `PostCreateInput!` A required object type specifying the data to create a new record.

**Standard create mutation**

```graphql
mutation {
    createPost(
        data: {
            title: "Foo"
            authorId: 2
            published: false
        }
    ) {
        id
        title
        published
    }
}
```

**Advanced create mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
author: {
    create: UserCreateInput, # One-to-one relation
    connect: UserWhereUniqueInput, # One-to-one relation
    connectOrCreate: UserConnectOrCreateInput # One-to-one relation
}
```

</p>
</details>

```graphql
mutation {
    createPost(
        data: {
            author: {
                connectOrCreate: {
                    where: PostWhereUniqueInput
                    create: PostCreateInput
                }
            }
        }
    ) {
        id
    }
}
```

### Updating a single post

Single post update mutations can take two input:

-   `where`: `PostWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).
-   `data`: `PostUpdateInput!` A required object type specifying the data to update.

**Standard update mutation**

```graphql
mutation {
    updatePost(
        where: { id: 2 }
        data: {
            title: "Foo"
            authorId: 2
            published: false
        }
    ) {
        id
        title
        published
    }
}
```

**Advanced update mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
author: {
    create: UserCreateInput, # One-to-one relation
    connect: UserWhereUniqueInput, # One-to-one relation
    connectOrCreate: UserConnectOrCreateInput, # One-to-one relation
    update: UserUpdateInput, # One-to-one relation
    upsert: UserUpsertInput, # One-to-one relation
    delete: true,
    disconnect: true,
}
```

</p>
</details>

```graphql
mutation {
    updatePost(
        data: {
            author: {
                connectOrCreate: {
                    where: PostWhereUniqueInput
                    create: PostCreateInput
                }
            }
        }
    ) {
        id
    }
}
```

### Deleting a single post

Single post delete mutations can take one input:

-   `where`: `PostWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard delete mutation**

```graphql
mutation {
    deletePost(where: { id: 2 }) {
        id
        title
        published
    }
}
```

### Deleting multiple posts

Multiple posts delete mutations can take one input:

-   `where`: `PostWhereInput!` A required object type specifying a field with a unique constraint (like title).

**Standard deleteMany mutation**

```graphql
mutation {
    deleteManyPosts(where: { title: "Foo" }) {
        count
    }
}
```

> `deleteManyPosts` returns an integer that represents the number of records that were deleted.

## Subscriptions

Subscriptions allows listen for data changes when a specific event happens, in real-time.

### Subscribing to a single post creation

```graphql
subscription {
    onCreatedPost {
        id
        title
        published
    }
}
```

### Subscribing to a single post update

```graphql
subscription {
    onUpdatedPost {
        id
        title
        published
    }
}
```

### Subscribing to a single post deletion

```graphql
subscription {
    onDeletedPost {
        id
        title
        published
    }
}
```
