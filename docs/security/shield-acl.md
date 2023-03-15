# Shield (Access Control Rules)

Fine-grained access control rules can be used via the `shield` property of Prisma-AppSync client, directly inside the Lambda Handler function.

::: warning SECURITY MUST NEVER BE TAKEN FOR GRANTED
Prisma-AppSync implements a basic mechanism to help mitigate some common issues. However, accuracy is not guaranteed and you should always test your own API security implementation.
:::

## 👉 Basic example

For example, we might want to only allow access to `PUBLISHED` posts:

```ts
return await prismaAppSync.resolve({
    event,
    shield: () => {
        // Prisma filtering syntax
        // https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
        const isPublished = { status: { equals: 'PUBLISHED' } }

        return {
            // Micromatch syntax
            // https://github.com/micromatch/micromatch
            'getPost{,/**}': {
                rule: isPublished,
                reason: () => 'Unpublished Posts cannot be accessed.',
            },
        }
    },
})
```

Useful links to create shield rules:

- [Micromatch syntax](https://github.com/micromatch/micromatch)
- [Micromatch tester](https://globster.xyz/?q=getPost%7B%2C%2F**%7D&f=getPost%2Ftitle%2CgetPost%2Fstatus)

## 👉 Usage with AppSync Authorization modes

Combining fine-grained access control with [AppSync Authorization modes](/security/appsync-authz) allows to implement powerful controls around data.

Let's assume we want to restrict API access to users logged in via `AMAZON_COGNITO_USER_POOLS` and only allow the owner of a given Post to modify it:

```ts
return await prismaAppSync.resolve({
    event,
    shield: ({ authorization, identity }: QueryParams) => {
        const isCognitoAuth = authorization === Authorizations.AMAZON_COGNITO_USER_POOLS
        const isOwner = { owner: { cognitoSub: identity?.sub } }

        return {
            '**': {
                rule: isCognitoAuth,
                reason: ({ model }) => `${model} access is restricted to logged-in users.`,
            },
            '{update,upsert,delete}Post{,/**}': {
                rule: isOwner,
                reason: ({ model }) => `${model} can only be modified by their owner.`,
            },
        }
    },
})
```

> The above example implies using Cognito User Pools Authorization. Plus having set up an `Owner` relation on the `Post` model, and a `cognitoSub` field on the `User` model (containing all users `sub`).

## 🚨 Order matters

The latest matching rule ALWAYS overrides previous ones.

```ts
// Bad - Second rule overrides first one
return {
    'listUsers/password': false,
    'listUsers{,/**}': true,
}

// Good - Always write the more specific rules last
return {
    'listUsers{,/**}': true,
    'listUsers/password': false
}
```
