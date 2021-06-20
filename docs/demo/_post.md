# Post

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `Post` type.

| Field       | Scalar Type       | Unique  | Required (create) |
| ----------- | ----------------- | ------- | ----------------- |
| id          | Int               | true    | true              |
| title       | String            | _false_ | true              |
| author      | [User](./User.md) | _false_ | _false_           |
| authorId    | Int               | true    | _false_           |
| published   | Boolean           | _false_ | true              |
| lastSavedAt | AWSDateTime       | _false_ | true              |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getPost`: Read a single Post.
-   `listPosts`: Read multiple Posts.

### Querying a single Post

Single Post queries can take one input:

-   `where`: `PostWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getPost(where: { id: 2 }) {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

### Querying multiple Posts

Multiple Posts queries can take four inputs:

-   `where`: `PostWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `PostOrderByInput` An optional object type to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    listPosts {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

**Standard query with offset pagination**

```graphql
query {
    listPosts(skip: 0, take: 25) {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

**Standard query with basic where filter**

```graphql
query {
    listPosts(where: { title: { equals: "Foo" } }) {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

**Standard query with more advanced where filter**

```graphql
query {
    listPosts(
        where: { title: { not: { equals: "Foo" } } }
    ) {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

**Standard query with orderBy**

```graphql
query {
    listPosts(orderBy: { title: DESC }) {
        id
        title
        author # Relation to one
        authorId
        published
        lastSavedAt
    }
}
```

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createPost`: Create a single Post.
-   `updatePost`: Update a single Post.
-   `upsertPost`: Update existing OR create single Post.
-   `deletePost`: Delete a single Post.
-   `createManyPosts`: Create multiple Posts.
-   `updateManyPosts`: Update multiple Posts.
-   `deleteManyPosts`: Delete multiple Posts.

### Creating a single Post

Single Post create mutations can take one input:

-   `data`: `PostCreateInput!` A required object type specifying the data to create a new record.

**Standard create mutation**

```graphql
mutation {
    createPost(
        data: {
            title: "Foo"
            authorId: 2
            published: false
            lastSavedAt: "dd/mm/YYYY"
        }
    ) {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```

**Advanced create mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
author: {
    create: PostAuthorCreateInput, # Relation to one
    connect: PostAuthorWhereUniqueInput, # Relation to one
    connectOrCreate: PostAuthorConnectOrCreateInput # Relation to one
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

### Updating a single Post

Single Post update mutations can take two input:

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
            lastSavedAt: "dd/mm/YYYY"
        }
    ) {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```

**Advanced update mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
author: {
    create: PostAuthorCreateInput, # Relation to one
    connect: PostAuthorWhereUniqueInput, # Relation to one
    connectOrCreate: PostAuthorConnectOrCreateInput, # Relation to one
    update: PostAuthorUpdateInput, # Relation to one
    upsert: PostAuthorUpsertInput, # Relation to one
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

### Deleting a single Post

Single Post delete mutations can take one input:

-   `where`: `PostWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard delete mutation**

```graphql
mutation {
    deletePost(where: { id: 2 }) {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```

### Deleting multiple Posts

Multiple Posts delete mutations can take one input:

-   `where`: `PostWhereFilterInput!` A required object type specifying a field with a unique constraint (like title).

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

### Subscribing to a single Post creation

```graphql
subscription {
    onCreatedPost {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```

### Subscribing to a single Post update

```graphql
subscription {
    onUpdatedPost {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```

### Subscribing to a single Post deletion

```graphql
subscription {
    onDeletedPost {
        id
        title
        authorId
        published
        lastSavedAt
    }
}
```
