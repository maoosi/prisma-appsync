# Changelog

## Version 1.0.0-beta.52

### ⚠️ Breaking

- Feat: Providing easier access to Prisma Client

```typescript
// initialise client
const app = new PrismaAppSync({
    connectionUrl: process.env.CONNECTION_URL
})

// access Prisma client
app.prisma.$use(async (params, next) => {
  console.log('This is middleware!')
  return next(params)
})
```

**Migration guide:**

- `app.$disconnect` replaced with `app.prisma.$disconnect`.
- `prisma` parameter removed from the before and after hooks functions, as well as from the customResolvers parameters. To access prisma from within hooks, directly use `app.prisma`.

### Non-breaking

- Feat: Support for prisma ^2.21.2 added.
- Feat: Lambda bundle size reduced (provided CDK boilerplate).

```typescript
afterBundling(inputDir: string, outputDir: string): string[] {
    return [
        'npx prisma generate', 
        'rm -rf node_modules/@prisma/engines', 
        'rm -rf node_modules/@prisma/client/node_modules', 
        'rm -rf node_modules/.bin', 
        'rm -rf node_modules/prisma',
        'rm -rf node_modules/prisma-appsync',
    ]
}
```

- Feat: Contribution guide added (see [CONTRIBUTING.md](CONTRIBUTING.md)) with new boilerplate testing workflow.
- Feat: Core library is now using Pnpm instead of Yarn.

## Version 1.0.0-beta.51

- Fix: Support for prisma ^2.20 added (output for generators can now be env vars).
- Feat: Ability to exclude fields and models from the generated GraphQL schema and API using `/// @PrismaAppSync.ignore` ([more details in the docs](https://prisma-appsync.vercel.app/guides/ignore.html)).
- Feat: Simpler boilerplate usage with `yarn create prisma-appsync-app <target-folder>`.
