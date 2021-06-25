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

The second step is to update the Lambda function handler. More precisely, to use the `registerCustomResolvers` method to register `incrementPostsViews` as a custom resolver (matching the mutation name from our schema).

```typescript{11-19}
import { PrismaAppSync, CustomResolverProps } from './prisma/generated/prisma-appsync/client'

// initialise client
const app = new PrismaAppSync({
    connectionUrl: process.env.CONNECTION_URL,
    debug: true
})

// Lambda function handler
export const main = async (event: any, context: any) => {
    // register new custom resolver `incrementPostsViews`
    const incrementPostsViews = 
        async ({ args }: CustomResolverProps) => {
            return await app.prisma.post.update({
                data: { views: { increment: 1 } },
                where: { id: args.postId }
            })
        }
    app.registerCustomResolvers({ incrementPostsViews })

    // parse the `event` from your Lambda function
    app.parseEvent(event)

    // handle CRUD operations / resolve query
    const result = await app.resolve()

    // return query result
    return Promise.resolve(result)
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

To do so, we update the beforeBundling function (located inside `cdk/index.ts`) with the below:

```typescript{7-21}
const lambdaFunction = new NodejsFunction(this, `${process.env.SERVICES_PREFIX}_Function`, {
    // ...
    bundling: {
        // ...
        commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
                const prismaSchema = path.join(
                    inputDir, String(process.env.PRISMA_SCHEMA_PATH)
                )
                const customSchema = path.join(
                    path.dirname(prismaSchema), 'custom-schema.gql'
                )
                const customResolvers = path.join(
                    path.dirname(prismaSchema), 'custom-resolvers.yaml'
                )

                return [
                    `cp ${prismaSchema} ${outputDir}`,
                    `cp ${customSchema} ${outputDir}`,
                    `cp ${customResolvers} ${outputDir}`,
                ]
            },
            // ...
        },
        // ...
    }
})
```

🚀🚀🚀 **Done! Next time you deploy your API on AWS AppSync, you should be able to use the newly created `incrementPostsViews` mutation.**
