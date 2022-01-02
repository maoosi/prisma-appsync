# HiddenModel

-   [Fields](#fields)
-   [Queries](#queries)
-   [Mutations](#mutations)
-   [Subscriptions](#subscriptions)

## Fields

List of fields available in the `HiddenModel` type.

| Field | Scalar Type | Unique | Required (create) |
| ----- | ----------- | ------ | ----------------- |
| id    | Int         | true   | true              |

## Queries

Queries are responsible for all `Read` operations.

The generated queries are:

-   `getHiddenModel`: Read a single HiddenModel.
-   `listHiddenModels`: Read multiple HiddenModels.
-   `countHiddenModels`: Count all HiddenModels.

### Querying a single HiddenModel

Single HiddenModel queries take one input:

-   `where`: `HiddenModelWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard query**

```graphql
query {
    getHiddenModel(where: { id: 2 }) {
        id
    }
}
```

### Querying multiple HiddenModels

Multiple HiddenModels queries can take four inputs:

-   `where`: `HiddenModelWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `[HiddenModelOrderByInput]` An optional array to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    listHiddenModels {
        id
    }
}
```

**Standard query with offset pagination**

```graphql
query {
    listHiddenModels(skip: 0, take: 25) {
        id
    }
}
```

**Standard query with basic where filter**

```graphql
query {
    listHiddenModels(where: {
        : { equals: }
    }) {
        id
        }
}
```

**Standard query with more advanced where filter**

```graphql
query {
    listHiddenModels(where: {
        : { not: { equals:  } }
    }) {
        id
        }
}
```

**Standard query with orderBy**

```graphql
query {
    listHiddenModels(
        orderBy: [
            { : DESC }
            ]
    ) {
        id
        }
}
```

### Counting HiddenModels

Counting HiddenModels queries can take four inputs:

-   `where`: `HiddenModelWhereFilterInput` An optional object type to filter the content based on a nested set of criteria.
-   `orderBy`: `[HiddenModelOrderByInput]` An optional array to select which field(s) and order to sort the records on. Sorting can be in ascending order `ASC` or descending order `DESC`.
-   `skip`: `Int` An optional number that specifies how many of the returned objects in the list should be skipped.
-   `take`: `Int` An optional number that specifies how many objects should be returned in the list.

**Standard query**

```graphql
query {
    countHiddenModels
}
```

> `countHiddenModels` returns an integer that represents the number of records found.

## Mutations

Mutations are responsible for all `Create`, `Update`, and `Delete` operations.

The generated mutations are:

-   `createHiddenModel`: Create a single HiddenModel.
-   `updateHiddenModel`: Update a single HiddenModel.
-   `upsertHiddenModel`: Update existing OR create single HiddenModel.
-   `deleteHiddenModel`: Delete a single HiddenModel.
-   `createManyHiddenModels`: Create multiple HiddenModels.
-   `updateManyHiddenModels`: Update multiple HiddenModels.
-   `deleteManyHiddenModels`: Delete multiple HiddenModels.

### Creating a single HiddenModel

Single HiddenModel create mutations take one input:

-   `data`: `HiddenModelCreateInput!` A required object type specifying the data to create a new record.

**Standard create mutation**

```graphql
mutation {
    createHiddenModel(data: {}) {
        id
    }
}
```

### Updating a single HiddenModel

Single HiddenModel update mutations take two inputs:

-   `where`: `HiddenModelWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).
-   `data`: `HiddenModelUpdateInput!` A required object type specifying the data to update.

**Standard update mutation**

```graphql
mutation {
    updateHiddenModel(where: { id: 2 }, data: {}) {
        id
    }
}
```

### Deleting a single HiddenModel

Single HiddenModel delete mutations take one input:

-   `where`: `HiddenModelWhereUniqueInput!` A required object type specifying a field with a unique constraint (like id).

**Standard delete mutation**

```graphql
mutation {
    deleteHiddenModel(where: { id: 2 }) {
        id
    }
}
```

### Creating multiple HiddenModels

Multiple HiddenModels create mutations take one input:

-   `data`: `[HiddenModelCreateManyInput!]` A required array specifying the data to create new records.
-   `skipDuplicates`: `Boolean` An optional Boolean specifying if unique fields or ID fields that already exist should be skipped.

**Standard deleteMany mutation**

```graphql
mutation {
    createManyHiddenModels(
        data: [
            { :  }
            { :  }
            { :  }
        ],
        skipDuplicates: true
    ) {
        count
    }
}
```

> `createManyHiddenModels` returns an integer that represents the number of records that were created.

### Updating multiple HiddenModels

Multiple HiddenModels update mutations take two inputs:

-   `where`: `HiddenModelWhereFilterInput!` A required object type to filter the content based on a nested set of criteria.
-   `data`: `HiddenModelUpdateInput!` A required object type specifying the data to update records with.

**Standard updateMany mutation**

```graphql
mutation {
    updateManyHiddenModels(
        where: { :  }
        data: { :  }
    ) {
        count
    }
}
```

> `updateManyHiddenModels` returns an integer that represents the number of records that were updated.

### Deleting multiple HiddenModels

Multiple HiddenModels delete mutations can take one input:

-   `where`: `HiddenModelWhereFilterInput!` A required object type to filter the content based on a nested set of criteria.

**Standard deleteMany mutation**

```graphql
mutation {
    deleteManyHiddenModels(
        where: {
            :
        }
    ) {
        count
    }
}
```

> `deleteManyHiddenModels` returns an integer that represents the number of records that were deleted.

## Subscriptions

Subscriptions allows listen for data changes when a specific event happens, in real-time.

### Subscribing to a single HiddenModel creation

Triggered from `createHiddenModel` mutation (excl. `createManyHiddenModels` and `upsertHiddenModel`).

```graphql
subscription {
    onCreatedHiddenModel {
        id
    }
}
```

### Subscribing to a single HiddenModel update

Triggered from `updateHiddenModel` mutation (excl. `updateManyHiddenModels` and `upsertHiddenModel`).

```graphql
subscription {
    onUpdatedHiddenModel {
        id
    }
}
```

### Subscribing to a single HiddenModel upsert

Triggered from `upsertHiddenModel` mutation.

```graphql
subscription {
    onUpsertedHiddenModel {
        id
    }
}
```

### Subscribing to a single HiddenModel deletion

Triggered from `deleteHiddenModel` mutation (excl. `deleteManyHiddenModels`).

```graphql
subscription {
    onDeletedHiddenModel {
        id
    }
}
```

### Subscribing to a single HiddenModel mutation

Triggered from ANY SINGLE record mutation (excl. `on*ManyHiddenModels`).

```graphql
subscription {
    onMutatedHiddenModel {
        id
    }
}
```

### Subscribing to many HiddenModel creations

Triggered from `createManyHiddenModels` mutation.

```graphql
subscription {
    onCreatedManyHiddenModels {
        count
    }
}
```

### Subscribing to many HiddenModel updates

Triggered from `updateManyHiddenModels` mutation.

```graphql
subscription {
    onUpdatedManyHiddenModels {
        count
    }
}
```

### Subscribing to many HiddenModel deletions

Triggered from `deleteManyHiddenModels` mutation.

```graphql
subscription {
    onDeletedManyHiddenModels {
        count
    }
}
```

### Subscribing to many HiddenModel mutations

Triggered from ANY MULTIPLE records mutation (excl. single record mutations).

```graphql
subscription {
    onMutatedManyHiddenModels {
        count
    }
}
```
