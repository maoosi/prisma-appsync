# Custom resolvers

Let's assume we want to extend our GraphQL CRUD API and add a custom mutation `incrementPostsViews` based on our Prisma Schema:

```prisma
model Post {
    id     Int  @id @default(autoincrement())
    views  Int
}
```

## 👉 1. Extending our GraphQL Schema

To extend our auto-generated `schema.gql`, we will create a new `custom-schema.gql` file next to our `schema.prisma` file:

```graphql
extend type Mutation {
  """
  Increment post views by +1
  """
  incrementPostsViews(postId: Int!): Post
}
```

For Prisma-AppSync to merge our `custom-schema.gql` with the auto-generated schema, we edit the `schema.prisma` generator config:

```json{3}
generator appsync {
  provider = "prisma-appsync"
  extendSchema = "./custom-schema.gql"
}
```

## 👉 2. Extending our Resolvers Config

For AWS AppSync to be able to use our new `incrementPostsViews` mutation, we also create a new `custom-resolvers.yaml` next to our `schema.prisma` file:

```yaml
- typeName: Mutation
  fieldName: incrementPostsViews
  dataSource: prisma-appsync
```

For Prisma-AppSync to merge our `custom-resolvers.yaml` with the auto-generated resolvers config, we edit the `schema.prisma` generator config:

```json{4}
generator appsync {
  provider = "prisma-appsync"
  extendSchema = "./custom-schema.gql"
  extendResolvers = "./custom-resolvers.yaml"
}
```

## 👉 3. Coding our new Resolver Function

Querying the `incrementPostsViews` mutation will automatically run a Resolver Function inside our Lambda `handler.ts` file. This is where we will code our custom business logic.

```ts
return await prismaAppSync.resolve<'incrementPostsViews'>({
    event,
    resolvers: {
        // code for our new resolver function
        incrementPostsViews: async ({ args, prismaClient }: QueryParamsCustom) => {
            return await prismaClient.post.update({
                data: { views: { increment: 1 } },
                where: { id: args.postId }
            })
        },
    }
})
```

## 👉 4. Updating our CDK file for bundling

To make sure our `custom-schema.gql` and `custom-resolvers.yaml` are properly bundled and deployed on AWS, we update the `beforeBundling` function inside `cdk/index.ts`:

```ts
function: {
  bundling: {
    commandHooks: {
      beforeBundling(inputDir: string, outputDir: string): string[] {
        const schema = path.join(inputDir, 'prisma/schema.prisma')
        const gql = path.join(inputDir, 'prisma/custom-schema.gql')
        const yaml = path.join(inputDir, 'prisma/custom-resolvers.yaml')

        return [
          `cp ${schema} ${outputDir}`,
          `cp ${gql} ${outputDir}`,
          `cp ${yaml} ${outputDir}`,
        ]
      },
    },
  }
}
```

🚀 **Done! Next time we deploy on AWS, we will be able to use our new `incrementPostsViews` mutation.**
