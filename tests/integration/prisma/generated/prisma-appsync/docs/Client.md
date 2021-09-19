# Client

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `Client` type.

| Field  | Scalar Type       | Unique  | Required (create) |
| ------ | ----------------- | ------- | ----------------- |
| id     | String            | true    | true              |
| postId | String            | true    | true              |
| Post   | [Post](./Post.md) | _false_ | true              |
| title  | String            | _false_ | true              |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getClient`: Read a single Client.
-   `listClients`: Read multiple Clients.
-   `countClients`: Count all Clients.

### Querying a single Client

Single Client queries take one input:

-   `where`: `ClientWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getClient(where: { id: "Foo" }) {
        id
        postId
        Post # Relation to one
        title
    }
}
```

### Querying multiple Clients

Multiple Clients queries can take four inputs:

-   `where`: `ClientWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `[ClientOrderByInput]` An optional array to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    listClients {
        id
        postId
        Post # Relation to one
        title
    }
}
```

**Standard query with offset pagination**

```graphql
query {
    listClients(skip: 0, take: 25) {
        id
        postId
        Post # Relation to one
        title
    }
}
```

**Standard query with basic where filter**

```graphql
query {
    listClients(where: { title: { equals: "Foo" } }) {
        id
        postId
        Post # Relation to one
        title
    }
}
```

**Standard query with more advanced where filter**

```graphql
query {
    listClients(
        where: { title: { not: { equals: "Foo" } } }
    ) {
        id
        postId
        Post # Relation to one
        title
    }
}
```

**Standard query with orderBy**

```graphql
query {
    listClients(orderBy: [{ title: DESC }]) {
        id
        postId
        Post # Relation to one
        title
    }
}
```

### Counting Clients

Counting Clients queries can take four inputs:

-   `where`: `ClientWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `[ClientOrderByInput]` An optional array to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    countClients
}
```

> `countClients` returns an integer that represents the number of records found.

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createClient`: Create a single Client.
-   `updateClient`: Update a single Client.
-   `upsertClient`: Update existing OR create single Client.
-   `deleteClient`: Delete a single Client.
-   `createManyClients`: Create multiple Clients.
-   `updateManyClients`: Update multiple Clients.
-   `deleteManyClients`: Delete multiple Clients.

### Creating a single Client

Single Client create mutations take one input:

-   `data`: `ClientCreateInput!` A required object type specifying the data to create a new record.

**Standard create mutation**

```graphql
mutation {
    createClient(data: { postId: "Foo", title: "Foo" }) {
        id
        postId
        title
    }
}
```

**Advanced create mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
Post: {
    create: ClientPostCreateInput, # Relation to one
    connect: ClientPostWhereUniqueInput, # Relation to one
    connectOrCreate: ClientPostConnectOrCreateInput # Relation to one
}
```

</p>
</details>

```graphql
mutation {
    createClient(
        data: {
            Post: {
                connectOrCreate: {
                    where: ClientWhereUniqueInput
                    create: ClientCreateInput
                }
            }
        }
    ) {
        id
    }
}
```

### Updating a single Client

Single Client update mutations take two inputs:

-   `where`: `ClientWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).
-   `data`: `ClientUpdateInput!` A required object type specifying the data to update.

**Standard update mutation**

```graphql
mutation {
    updateClient(
        where: { id: "Foo" }
        data: { postId: "Foo", title: "Foo" }
    ) {
        id
        postId
        title
    }
}
```

**Advanced update mutation using relation queries**

<details><summary>List of all nested queries available</summary>
<p>

```graphql
Post: {
    create: ClientPostCreateInput, # Relation to one
    connect: ClientPostWhereUniqueInput, # Relation to one
    connectOrCreate: ClientPostConnectOrCreateInput, # Relation to one
    update: ClientPostUpdateInput, # Relation to one
    upsert: ClientPostUpsertInput, # Relation to one
    delete: true,
    disconnect: true,
}
```

</p>
</details>

```graphql
mutation {
    updateClient(
        data: {
            Post: {
                connectOrCreate: {
                    where: ClientWhereUniqueInput
                    create: ClientCreateInput
                }
            }
        }
    ) {
        id
    }
}
```

### Deleting a single Client

Single Client delete mutations take one input:

-   `where`: `ClientWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard delete mutation**

```graphql
mutation {
    deleteClient(where: { id: "Foo" }) {
        id
        postId
        title
    }
}
```

### Creating multiple Clients

Multiple Clients create mutations take one input:

-   `data`: `[ClientCreateManyInput!]` A required array specifying the data to create new records.
-   `skipDuplicates`: `Boolean` An optional Boolean specifying if unique fields or ID fields that already exist should be skipped.

**Standard deleteMany mutation**

```graphql
mutation {
    createManyClients(
        data: [
            { title: "Foo" }
            { title: "Foo" }
            { title: "Foo" }
        ]
        skipDuplicates: true
    ) {
        count
    }
}
```

> `createManyClients` returns an integer that represents the number of records that were created.

### Updating multiple Clients

Multiple Clients update mutations take two inputs:

-   `where`: `ClientWhereFilterInput!` A required object type to filter the content based on a nested set of criteria.
-   `data`: `ClientUpdateInput!` A required object type specifying the data to update records with.

**Standard updateMany mutation**

```graphql
mutation {
    updateManyClients(
        where: { title: "Foo" }
        data: { title: "Foo" }
    ) {
        count
    }
}
```

> `updateManyClients` returns an integer that represents the number of records that were updated.

### Deleting multiple Clients

Multiple Clients delete mutations can take one input:

-   `where`: `ClientWhereFilterInput!` A required object type to filter the content based on a nested set of criteria.

**Standard deleteMany mutation**

```graphql
mutation {
    deleteManyClients(where: { title: "Foo" }) {
        count
    }
}
```

> `deleteManyClients` returns an integer that represents the number of records that were deleted.

## Subscriptions

Subscriptions allows listen for data changes when a specific event happens, in real-time.

### Subscribing to a single Client creation

Triggered from `createClient` mutation (excl. `createManyClients` and `upsertClient`).

```graphql
subscription {
    onCreatedClient {
        id
        postId
        title
    }
}
```

### Subscribing to a single Client update

Triggered from `updateClient` mutation (excl. `updateManyClients` and `upsertClient`).

```graphql
subscription {
    onUpdatedClient {
        id
        postId
        title
    }
}
```

### Subscribing to a single Client upsert

Triggered from `upsertClient` mutation.

```graphql
subscription {
    onUpsertedClient {
        id
        postId
        title
    }
}
```

### Subscribing to a single Client deletion

Triggered from `deleteClient` mutation (excl. `deleteManyClients`).

```graphql
subscription {
    onDeletedClient {
        id
        postId
        title
    }
}
```

### Subscribing to a single Client mutation

Triggered from ANY SINGLE record mutation (excl. `on*ManyClients`).

```graphql
subscription {
    onMutatedClient {
        id
        postId
        title
    }
}
```

### Subscribing to many Client creations

Triggered from `createManyClients` mutation.

```graphql
subscription {
    onCreatedManyClients {
        count
    }
}
```

### Subscribing to many Client updates

Triggered from `updateManyClients` mutation.

```graphql
subscription {
    onUpdatedManyClients {
        count
    }
}
```

### Subscribing to many Client deletions

Triggered from `deleteManyClients` mutation.

```graphql
subscription {
    onDeletedManyClients {
        count
    }
}
```

### Subscribing to many Client mutations

Triggered from ANY MULTIPLE records mutation (excl. single record mutations).

```graphql
subscription {
    onMutatedManyClients {
        count
    }
}
```
