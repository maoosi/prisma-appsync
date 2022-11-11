# 🪝 Adding Hooks

Hooks let you “hook into” Prisma-AppSync lifecycle to either trigger custom business logic or manipulate data at runtime.

## 👉 Example code

```ts
return await prismaAppSync.resolve<'likePost'>({
    event,
    hooks: {
        // execute before any query
        'before:**': async (data: BeforeHookParams) => data,

        // execute after any query
        'after:**': async (data: AfterHookParams) => data,

        // execute after custom resolver query `likePost`
        // (e.g. `query { likePost(postId: 3) }`)
        'after:likePost': async (data: AfterHookParams) => {
            await data.prismaClient.notification.create({
                data: {
                    event: 'POST_LIKED',
                    targetId: data.args.postId,
                    userId: data.authIdentity.sub,
                },
            })
            return data
        },
    },
})
```

## 👉 Types

```ts
export interface QueryParams {
    type: GraphQLType
    operation: string
    context: Context
    fields: string[]
    paths: string[]
    args: any
    prismaArgs: PrismaArgs
    authorization: Authorization
    identity: Identity
    headers: any
    prismaClient: PrismaClient
}

type BeforeHookParams = QueryParams

type AfterHookParams = QueryParams & {
    result: any | any[]
}
```

## 👉 Usage rules

- Hooks are made of a **Path** (e.g. `after:updatePost`) and an async function.
- **Path** syntax always starts with `before:` or `after:`.

    > `before` or `after` querying data from the database.

- **Path** syntax after `:` uses [Micromatch syntax](https://github.com/micromatch/micromatch).
- Hooks are fully typed, so VSCode IntelliSense will give you the full list of Hooks Paths you can use while typing. Example:

![Prisma-AppSync hooks on VS Code](/guides/hooks-autocompletion.png)

- Hooks functions all receive a single object as a parameter. Here is an example object received inside `after:getPost`:

```json
{
    "type": "Query",
    "operation": "getPost",
    "context": { "action": "get", "alias": "access", "model": "Post" },
    "fields": ["title", "status"],
    "paths": ["get/post/title", "get/post/status"],
    "args": { "where": { "id": 5 } },
    "prismaArgs": {
        "where": { "id": 5 },
        "select": { "title": true, "status": true }
    },
    "authorization": "API_KEY",
    "identity": {},
    "result": { "title": "My first post", "status": "PUBLISHED" }
}
```

- Key `result` is only available inside `after` hooks.
- Hooks async functions MUST return the object received as a parameter (either mutated or untouched).
- Using hooks on custom resolvers requires explicitly listing resolvers using a TypeScript Generic `prismaAppSync.resolve<T>`:

```ts
// Using custom resolver `likePost`
return await prismaAppSync.resolve<'likePost'>({ event, hooks })

// Using multiple custom resolvers
return await prismaAppSync.resolve<'likePost' | 'unlikePost'>({ event, hooks })
```
