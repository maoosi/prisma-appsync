# Rate limiter (DOS)

::: warning WARNING NOTICE
Limits are kept in memory and are not shared between function instantiations. This means limits can reset arbitrarily when new instances get spawned or different instances are used to serve requests.
:::

## 👉 Usage

Prisma-AppSync uses in-memory rate-limiting to try protect your Database from most common DOS attacks.

To change the default value (default to 200 requests per user, per minute), you can adjust the `maxReqPerUserMinute` option when instantiating the Client:

```ts
const prismaAppSync = new PrismaAppSync({ maxReqPerUserMinute: 500 })
```

## 👉 Disable rate limiter

If you prefer to disable the in-memory rate limiter, set the option to false:

```ts
const prismaAppSync = new PrismaAppSync({ maxReqPerUserMinute: false })
```
