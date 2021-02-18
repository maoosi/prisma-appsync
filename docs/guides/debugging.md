---
sidebarDepth: 0
---

# Debugging

## 👉 Enabling detailed logs

Prisma-AppSync offers detailed logs about what's happening under the hood. After enabling debug mode, you should be able to see logs appear in CloudWatch.

**When initiating `PrismaAppSync` class:**

```typescript{3}
const app = new PrismaAppSync({
    connectionUrl: String(process.env.CONNECTION_URL),
    debug: true // enable detailed logs (access from CloudWatch)
})
```
