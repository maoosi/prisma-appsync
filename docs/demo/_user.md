# User

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `User` type.

| Field    | Scalar Type          | Unique  | Required (create) |
| -------- | -------------------- | ------- | ----------------- |
| id       | Int                  | true    | true              |
| username | String               | true    | true              |
| email    | AWSEmail             | true    | true              |
| role     | Role                 | _false_ | true              |
| posts    | [[Post!]](./Post.md) | _false_ | _false_           |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getUser`: Read a single User.
-   `listUsers`: Read multiple Users.

### Querying a single User

Single User queries can take one input:

-   `where`: `UserWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getUser(where: { id: 2 }) {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

### Querying multiple Users

Multiple Users queries can take four inputs:

-   `where`: `UserWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `UserOrderByInput` An optional object type to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    listUsers {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

**Standard query with offset pagination**

```graphql
query {
    listUsers(skip: 0, take: 25) {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

**Standard query with basic where filter**

```graphql
query {
    listUsers(where: { role: { equals: Role } }) {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

**Standard query with more advanced where filter**

```graphql
query {
    listUsers(where: { role: { not: { equals: Role } } }) {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

**Standard query with orderBy**

```graphql
query {
    listUsers(orderBy: { role: DESC }) {
        id
        username
        email
        role

        posts # Relation to many
    }
}
```

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createUser`: Create a single User.
-   `updateUser`: Update a single User.
-   `upsertUser`: Update existing OR create single User.
-   `deleteUser`: Delete a single User.
-   `createManyUsers`: Create multiple Users.
-   `updateManyUsers`: Update multiple Users.
-   `deleteManyUsers`: Delete multiple Users.

### Creating a single User

Single User create mutations can take one input:

-   `data`: `UserCreateInput!` A required object type specifying the data to create a new record.

**Standard create mutation**

```graphql
mutation {
    createUser(
        data: { username: "Foo", email: "Foo", role: Role }
    ) {
        id
        username
        email
        role
    }
}
```

**Advanced create mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
posts: {
    create: [UserPostsCreateInput], # Relation to many
    connect: [UserPostsWhereUniqueInput], # Relation to many
    connectOrCreate: [UserPostsConnectOrCreateInput] # Relation to many
}
```

</p>
</details>

```graphql
mutation {
    createUser(
        data: {
            posts: {
                connectOrCreate: [
                    {
                        where: UserWhereUniqueInput
                        create: UserCreateInput
                    }
                ]
            }
        }
    ) {
        id
    }
}
```

### Updating a single User

Single User update mutations can take two input:

-   `where`: `UserWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).
-   `data`: `UserUpdateInput!` A required object type specifying the data to update.

**Standard update mutation**

```graphql
mutation {
    updateUser(
        where: { id: 2 }
        data: { username: "Foo", email: "Foo", role: Role }
    ) {
        id
        username
        email
        role
    }
}
```

**Advanced update mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
posts: {
    create: [UserPostsCreateInput], # Relation to many
    connect: [UserPostsWhereUniqueInput], # Relation to many
    connectOrCreate: [UserPostsConnectOrCreateInput], # Relation to many
    update: [UserPostsUpdateUniqueInput], # Relation to many
    upsert: [UserPostsUpsertUniqueInput], # Relation to many
    delete: [UserPostsDeleteUniqueInput], # Relation to many
    disconnect: [UserPostsWhereUniqueInput], # Relation to many
    set: [UserPostsWhereUniqueInput], # Relation to many
    updateMany: [UserPostsUpdateManyInput], # Relation to many
    deleteMany: [UserPostsDeleteManyInput], # Relation to many
}
```

</p>
</details>

```graphql
mutation {
    updateUser(
        data: {
            posts: {
                connectOrCreate: [
                    {
                        where: UserWhereUniqueInput
                        create: UserCreateInput
                    }
                ]
            }
        }
    ) {
        id
    }
}
```

### Deleting a single User

Single User delete mutations can take one input:

-   `where`: `UserWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard delete mutation**

```graphql
mutation {
    deleteUser(where: { id: 2 }) {
        id
        username
        email
        role
    }
}
```

### Deleting multiple Users

Multiple Users delete mutations can take one input:

-   `where`: `UserWhereFilterInput!` A required object type specifying a field with a unique constraint (like role).

**Standard deleteMany mutation**

```graphql
mutation {
    deleteManyUsers(where: { role: Role }) {
        count
    }
}
```

> `deleteManyUsers` returns an integer that represents the number of records that were deleted.

## Subscriptions

Subscriptions allows listen for data changes when a specific event happens, in real-time.

### Subscribing to a single User creation

```graphql
subscription {
    onCreatedUser {
        id
        username
        email
        role
    }
}
```

### Subscribing to a single User update

```graphql
subscription {
    onUpdatedUser {
        id
        username
        email
        role
    }
}
```

### Subscribing to a single User deletion

```graphql
subscription {
    onDeletedUser {
        id
        username
        email
        role
    }
}
```
