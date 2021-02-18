---
sidebarDepth: 0
---

# User Type

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `User` type.

| Field    | Kind         | Scalar Type | Unique   | Required (create) |
| -------- | ------------ | ----------- | -------- | ----------------- |
| id       | scalar       | Int         | **true** | **true**          |
| username | scalar       | String      | **true** | **true**          |
| email    | scalar       | AWSEmail    | **true** | **true**          |
| role     | enum         | Role        | false    | **true**          |
| posts    | **relation** | [Post]      | false    | false             |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getUser`: Read a single user.
-   `listUsers`: Read multiple users.

### Querying a single user

Single user queries can take one input:

-   `where`: `UserWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getUser(where: { id: 2 }) {
        id
        username
        email
        role

        posts # One-to-many relation
    }
}
```

### Querying multiple users

Multiple users queries can take two inputs:

-   `where`: `UserWhereInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `UserOrderByInput` An optional object type to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.

**Standard query**

```graphql
query {
    listUsers {
        id
        username
        email
        role

        posts # One-to-many relation
    }
}
```

**Standard query with where**

```graphql
query {
    listUsers(where: { role: Role }) {
        id
        username
        email
        role

        posts # One-to-many relation
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
getusername: String
    username_equals: String
    username_not: String
    username_lt: String
    username_lte: String
    username_gt: String
    username_gte: String
    username_contains: String
    username_startsWith: String
    username_endsWith: String
getemail: AWSEmail
    email_equals: AWSEmail
    email_not: AWSEmail
    email_lt: AWSEmail
    email_lte: AWSEmail
    email_gt: AWSEmail
    email_gte: AWSEmail
    email_contains: AWSEmail
    email_startsWith: AWSEmail
    email_endsWith: AWSEmail
getrole: Role
    role_equals: Role
    role_not: Role
    role_lt: Role
    role_lte: Role
    role_gt: Role
    role_gte: Role
    role_contains: Role
    role_startsWith: Role
    role_endsWith: Role

```

</p>
</details>

```graphql
query {
    listUsers(where: { role_startsWith: Role }) {
        posts # One-to-many relation
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

        posts # One-to-many relation
    }
}
```

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createUser`: Create a single user.
-   `updateUser`: Update a single user.
-   `upsertUser`: Update existing OR create single user.
-   `deleteUser`: Delete a single user.
-   `deleteManyUsers`: Delete multiple users.

### Creating a single user

Single user create mutations can take one input:

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
    create: [PostCreateInput], # One-to-many relation
    connect: [PostWhereUniqueInput], # One-to-many relation
    connectOrCreate: [PostConnectOrCreateInput] # One-to-many relation
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

### Updating a single user

Single user update mutations can take two input:

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
    create: [PostCreateInput], # One-to-many relation
    connect: [PostWhereUniqueInput], # One-to-many relation
    connectOrCreate: [PostConnectOrCreateInput], # One-to-many relation
    update: [PostUpdateUniqueInput], # One-to-many relation
    upsert: [PostUpsertUniqueInput], # One-to-many relation
    delete: [PostDeleteUniqueInput], # One-to-many relation
    disconnect: [PostWhereUniqueInput], # One-to-many relation
    set: [PostWhereUniqueInput], # One-to-many relation
    updateMany: [PostUpdateManyInput], # One-to-many relation
    deleteMany: [PostDeleteManyInput], # One-to-many relation
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

### Deleting a single user

Single user delete mutations can take one input:

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

### Deleting multiple users

Multiple users delete mutations can take one input:

-   `where`: `UserWhereInput!` A required object type specifying a field with a unique constraint (like role).

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

### Subscribing to a single user creation

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

### Subscribing to a single user update

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

### Subscribing to a single user deletion

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
