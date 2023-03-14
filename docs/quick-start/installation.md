# Installation

## 👉 Option 1: Using the CLI Installer (recommended)

Run the following command and follow the prompts 🙂

```bash
npx create-prisma-appsync-app@latest
```

🚀 Done!

## 👉 Option 2: Manual Install

Add `prisma-appsync` to your project dependencies.

```bash
# using yarn
yarn add prisma-appsync

# using npm
npm i prisma-appsync
```

Edit your `schema.prisma` file and add:

```json
generator appsync {
  provider = "prisma-appsync"
}
```

Also make sure to use the right binary targets:

```json{3}
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```

Generate your Prisma Client (this will also generate your Prisma-AppSync client):

```bash
npx prisma generate
```

Create your `handler.ts` Lambda handler (AppSync Direct Lambda Resolver):

```ts
// Import generated Prisma-AppSync client (adjust path as necessary)
import { PrismaAppSync } from './prisma/generated/prisma-appsync/client'

// Instantiate Prisma-AppSync Client
const prismaAppSync = new PrismaAppSync()

// Lambda handler (AppSync Direct Lambda Resolver)
export const main = async (event: any) => {
    return await prismaAppSync.resolve({ event })
}
```

Either copy the AWS CDK boilerplate provided with Prisma-AppSync into your project, OR just use it as a reference for your own CDK config:

```bash
# path to cdk boilerplate
./node_modules/prisma-appsync/dist/boilerplate/cdk/
```

Refer to [AWS CDK Toolkit docs ↗](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) for more info.

