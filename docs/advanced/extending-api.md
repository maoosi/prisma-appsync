# 🔌 Extending the API

It can be useful to extend the default GraphQL CRUD API, using custom Types and Resolvers.

::: tip USE CASE
To illustrate this, let's assume we have an existing model `Post` with field `views`. We want to add a custom mutation `incrementPostsViews` and build a custom resolver to increment post views on every call.
:::

## 👉 1. Extending `schema.gql`

Let’s start by creating a new `custom-schema.gql` file at the same location as the `schema.prisma` file:

```graphql
extend type Mutation {
  """
  Increment post views by +1
  """
  incrementPostsViews(postId: Int!): Post
}
```

Next time we run `npx prisma generate`, we want Prisma-AppSync to merge our `custom-schema.gql` with the default schema output. To do so, we edit the generator config as follows:

```json{3}
generator appsync {
  provider = "prisma-appsync"
  extendSchema = "./custom-schema.gql"
}
```

## 👉 2. Extending `resolvers.yaml`

We want AWS AppSync to make the link between our new `incrementPostsViews` mutation (added in the previous step) and our Lambda function resolver. To do so, we create a new `custom-resolvers.yaml` file at the same location as our `schema.prisma` file:

```yaml
- typeName: Mutation
  fieldName: incrementPostsViews
  dataSource: prisma-appsync
```

Next time we run `npx prisma generate`, we want Prisma-AppSync to merge our `custom-resolvers.yaml` with the default resolvers config output. To do so, we edit our generator config as per the following:

```json{4}
generator appsync {
  provider = "prisma-appsync"
  extendSchema = "./custom-schema.gql"
  extendResolvers = "./custom-resolvers.yaml"
}
```

## 👉 3. Lambda function handler

For our Lambda function handler (= API resolver function) to process our newly created `incrementPostsViews` mutation, we need to declare a new resolver:

```ts
return await prismaAppSync.resolve<'incrementPostsViews'>({
    event,
    resolvers: {
        incrementPostsViews: async ({ args, prismaClient }: QueryParamsCustom) => {
            return await prismaClient.post.update({
                data: { views: { increment: 1 } },
                where: { id: args.postId }
            })
        },
    }
})
```

## 👉 4. AppSyncStack function bundling

::: warning NOTE
This step only applies if using the AWS CDK boilerplate provided with Prisma-AppSync.
:::

Finally, we want to make sure that `custom-schema.gql` and `custom-resolvers.yaml` are both parts of the bundle uploaded on AWS Lambda. To do so, we update the beforeBundling function inside `cdk/index.ts` with the below (adjust paths as necessary):

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

🚀🚀🚀 **Done! Next time we deploy your API on AWS AppSync, we should be able to use the newly created `incrementPostsViews` mutation.**
