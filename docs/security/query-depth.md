# Query depth

## 👉 Usage

By default, Prisma-AppSync will prevent clients from abusing query depth, by limiting the query complexity.

**For example, it will prevent clients from doing this:**

```graphql
query IAmEvil {
  author(id: "abc") {
    posts {
      author {
        posts {
          author {
            posts {
              author {
                # that could go on as deep as the client wants!
              }
            }
          }
        }
      }
    }
  }
}
```

Default value for the maximum query depth is set to `3`. It is possible to change the default max depth value via the `maxDepth` option:

```ts
const prismaAppSync = new PrismaAppSync({ maxDepth: 4 })
```
