---
sidebarDepth: 1
---

# Client API

The Prisma-AppSync Client API reference:

## Constructor

Prisma-AppSync client constructor Class.

### Example

```typescript
const app = new PrismaAppSync({
    connectionUrl: process.env.DB_CONNECTION_URL,
    sanitize: true,
    debug: true,
}: Options)
```

### Properties

| Property | Description |
|--|--|--|
| `connectionUrl` | Database [Connection URL](https://www.prisma.io/docs/reference/database-reference/connection-urls). |
| `debug` | Enable or disable detailed logs for Prisma-AppSync. Default to `false`. |
| `sanitize` | Enable or disable xss sanitization. Default to `true`. |

#### [Relevant types](/reference/client-types.html#constructor)

## registerCustomResolvers

Custom resolvers to extend the generated CRUD API.

### Example

```typescript
app.registerCustomResolvers({
    incrementPostsViews: async (props:CustomResolverProps) => {
        console.log("Hello from the `incrementPostsViews` custom resolver", props)
        return {}
    }
})
```

#### [Relevant types](/reference/client-types.html#customresolverprops)

## parseEvent

Parse raw Lambda function handler event (invoked by AWS AppSync as a Direct Lambda Resolver).

### Example

```typescript
app.parseEvent(event)
```

## beforeResolve

Hook called before resolving via the `resolve` method.

### Example

```typescript
app.beforeResolve(async ({
    operation,
    args,
    authIdentity,
    fields,
    requestSetPaths,
    subject    
}: BeforeResolveProps) => {
    // custom business logic
})
```

### Parameters

| Parameter | Description |
|--|--|--|
| `operation` | Operation performed by the API request (e.g. `get`, `list`, `create`, `update`, `delete`). |
| `args` | Object of arguments that are part of the API request (e.g. `{ where: { id: 2 } }`). |
| `authIdentity` | Contains informations about the caller and the detected AppSync authorization mode (e.g. `API_KEY`, `AWS_IAM`, `AMAZON_COGNITO_USER_POOLS`). |
| `fields` | Array of fields that are part of the API request (e.g. `['title', 'authorId', 'publishedAt']`). |
| `requestSetPaths` | Array of paths (`operation/subject/field`) that are part of the API request (e.g. `['get/post/title']`). |
| `subject` | Subject (or model) name (e.g. `Post`, `User`, `Comment`). |

#### [Relevant types](/reference/client-types.html#hooks)

### Return type

Returning `false` from the hook would cancel the API request operation. Not returning anything or returning `true` would allow to continue the API request operation.

## afterResolve

Hook called after resolving via the `resolve` method.

### Example

```typescript
app.afterResolve(async ({
    operation,
    args,
    authIdentity,
    fields,
    requestSetPaths,
    result,
    subject  
}: AfterResolveProps) => {
    // custom business logic
})
```

### Parameters

| Parameter | Description |
|--|--|--|
| `operation` | Operation performed by the API request (e.g. `get`, `list`, `create`, `update`, `delete`). |
| `args` | Object of arguments that are part of the API request (e.g. `{ where: { id: 2 } }`). |
| `authIdentity` | Contains informations about the caller and the detected AppSync authorization mode (e.g. `API_KEY`, `AWS_IAM`, `AMAZON_COGNITO_USER_POOLS`). |
| `fields` | Array of fields that are part of the API request (e.g. `['title', 'authorId', 'publishedAt']`). |
| `requestSetPaths` | Array of paths (`operation/subject/field`) that are part of the API request (e.g. `['get/post/title']`). |
| `result` | Prisma Client query result. |
| `subject` | Subject (or model) name (e.g. `Post`, `User`, `Comment`). |

#### [Relevant types](/reference/client-types.html#hooks)

## allow

Fine-Grained access control rules powered by [CASL](https://casl.js.org).

### Example

```typescript
app.allow({
    action: AuthActions.access,
    subject: 'Post',
    fields: ['title']
}: AuthRule)
```

### Parameters

| Parameter | Description |
|--|--|--|
| `action` | Rule action(s) that is should apply to. |
| `subject` | Rule subject(s) that is should apply to. |
| `fields` | Rule fields that is should apply to. |
| `condition` | Rule condition(s) used to restrict the operation. |
| `reason` | Reason that describes why the rule was allowed. |

#### [Relevant types](/reference/client-types.html#access-control)

## deny

Fine-Grained access control rules powered by [CASL](https://casl.js.org).

### Example

```typescript
app.deny({
    action: AuthActions.modify,
    subject: 'Post',
    condition: {
        authorId: { $ne: 4 }
    },
    reason: 'Modifying someone elses [Post] is not allowed.'
}: AuthRule)
```

### Parameters

| Parameter | Description |
|--|--|--|
| `action` | Rule action(s) that is should apply to. |
| `subject` | Rule subject(s) that is should apply to. |
| `fields` | Rule fields that is should apply to. |
| `condition` | Rule condition(s) used to restrict the operation. |
| `reason` | Reason that describes why the rule was denied. |

#### [Relevant types](/reference/client-types.html#access-control)

## resolve

Resolve the API request using Prisma-AppSync and return the result formatted for AppSync response.

### Example

```typescript
const result = await app.resolve()
```

## prisma

Access Prisma Client.

```typescript
// use prisma middleware
app.prisma.$use(async (params, next) => {
    console.log('This is middleware!')
    return next(params)
})

// close the database connections
await app.prisma.$disconnect()
```
