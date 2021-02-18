---
sidebarDepth: 1
---

# Generator options

The Prisma-AppSync Generator reference:

## output

Default generator output directory.

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    output = "src/generated/prisma-appsync"
}
```

## customSchema

Custom GraphQL schema to extend the generated AppSync schema. [Extending types in GraphQL](https://www.apollographql.com/docs/federation/entities/#extending)

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    customSchema = "./custom-schema.gql"
}
```

## customResolvers

Custom AppSync resolvers to extend the generated resolvers. [AppSync Resolvers options](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-appsync.Resolver.html)

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    customResolvers = "./custom-resolvers.yaml"
}
```

## directiveAlias_default

Default AppSync directive applied to all generated Types. [AppSync directives](https://docs.aws.amazon.com/appsync/latest/devguide/security.html)

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    directiveAlias_default = "@aws_iam @aws_cognito_user_pools(cognito_groups: [\"users\", \"admins\"])"
}
```

## directiveAlias_[aliasName]

Custom directive alias usable in your schema using `@@[aliasName]`, where `[aliasName]` is a camel case formatted string.

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    directiveAlias_cognitoAdminsOnly = "@aws_cognito_user_pools(cognito_groups: [\"admins\"])"
}
```

## debug

Enable debug logs for the generator.

```typescript{3}
generator appsync {
    provider = "prisma-appsync"
    debug = true
}
```
