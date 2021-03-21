---
sidebarDepth: 0
---

# Extending the API

In some cases, it might be useful to extend the GraphQL CRUD API that is being generated, using custom types and resolvers.

> **To illustrate this**, let's assume we have an existing model "Post" with a field "views". We want to add a custom mutation `incrementPostsViews` and build a custom resolver to increment post views on every call.

## 👉 1. Extending `schema.gql`

The first thing to do, is to create a new `custom-schema.gql` file at the same location as our `schema.prisma` file:

```graphql
extend type Mutation {
    incrementPostsViews(postId: Int!): Post
}
```

Next time we run `npx prisma generate`, we want Prisma-AppSync to merge our `custom-schema.gql` with the default schema output. To do so, we will need to edit our generator config as per the following:

```typescript
generator appsync {
    // ...
    customSchema = "./custom-schema.gql"
}
```

## 👉 2. Lambda function handler

The second step is to update the Lambda function handler. More precisely, to add a `customResolvers` object inside `new PrismaAppSync()` class instantiation. Since the mutation name in our schema is `incrementPostsViews`, we use the same name for our custom resolver.

```typescript
import { PrismaAppSync, CustomResolverProps } from './generated/prisma-appsync/client'

// ...

const incrementPostsViews = 
    async ({ prisma, args }: CustomResolverProps) => {
        return await prisma.post.update({
            data: { views: { increment: 1 } },
            where: { id: args.postId }
        })
    }

const app = new PrismaAppSync({
    connectionUrl: String(process.env.CONNECTION_URL),
    customResolvers: { incrementPostsViews }
})
```

See full list of options, methods and types in the [Reference](/reference) section.

## 👉 3. Extending `resolvers.yaml`

The third and last step, is for AWS AppSync to make the link between our new `incrementPostsViews` mutation and our Lambda function resolver. To do so, we create a new `custom-resolvers.yaml` file at the same location as our `schema.prisma` file:

```yaml
-   
    typeName: Mutation
    fieldName: incrementPostsViews
    dataSource: prisma-appsync
```

Next time we run `npx prisma generate`, we want Prisma-AppSync to merge our `custom-resolvers.yaml` with the default resolvers file output. To do so, we will need to edit our generator config as per the following:

```typescript
generator appsync {
    // ...
    customResolvers = "./custom-resolvers.yaml"
}
```

## 👉 4. NodeJS function bundler

> This step applies if using the AWS CDK boilerplate provided with Prisma-AppSync.

We want to make sure both `custom-schema.gql` and `custom-resolvers.yaml` files are copied in the build folder, so that Prisma generate works properly.

To do so, we update the `cdk/index.ts` file with highlighted code:

```typescript{7-15}
const lambdaFunction = new NodejsFunction(this, `${process.env.SERVICES_PREFIX}_Function`, {
    // ...
    bundling: {
        minify: true,
        commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
                const prismaSchema = path.join(inputDir, process.env.PRISMA_SCHEMA_ROOT_PATH || 'schema.prisma')
                const customSchema = path.join(path.dirname(prismaSchema), 'custom-schema.gql')
                const customResolvers = path.join(path.dirname(prismaSchema), 'custom-resolvers.yaml')

                return [
                    `cp ${prismaSchema} ${outputDir}`,
                    `cp ${customSchema} ${outputDir}`,
                    `cp ${customResolvers} ${outputDir}`,
                ]
            },
            beforeInstall() {
                return []
            },
            afterBundling() {
                return [`npx prisma generate`]
            }
        },
        nodeModules: ['prisma', '@prisma/client', 'prisma-appsync'],
    }
})
```

🚀🚀🚀 **Done! Next time you deploy your API on AWS AppSync, you should be able to use the newly created `incrementPostsViews` mutation.**
