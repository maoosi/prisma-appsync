# ⚡️ Getting started

## 👉 Installation

### Method 1: Using the CLI Installer

Run the following command and follow the prompts 🙂

```bash
npx create-prisma-appsync-app@preview
```

### Method 2: Manual Install

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

Either copy the AWS CDK boilerplate provided with Prisma-AppSync into your project, OR simply use it as reference for your own CDK config:

```bash
# path to cdk boilerplate
./node_modules/prisma-appsync/dist/boilerplate/cdk/
```

Refer to [AWS CDK Toolkit docs ↗](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) for more info.

## 👉 Usage

::: warning NOTE
Folder structure and deploy approach might differ if installing Prisma-AppSync manually, instead of using the recommended CLI Installer.
:::

### Folder structure

After running the installation command, you should end up with the following structure:

```bash
project/
  |__ handler.ts  # lambda function handler (API resolver)
  |__ cdk/        # AWS CDK deploy boilerplate
  |__ prisma/
    |__ schema.prisma  # prisma schema (data source)
    |__ generated/     # auto-generated after each `npx prisma generate`
```

### Generating the API

All the files inside the `prisma/generated` directory will be auto-generated each time you run `npx prisma generate`. Theses files contains everything required to deploy and run your API.

Updating fields or adding a new model? Simply update your `schema.prisma` file, then run:

```bash
npx prisma generate
```

### Deploying the API

Make sure to install and configure the AWS CLI and the AWS CDK CLI on your local machine. Then simply run the below CDK CLI command:

```bash
yarn deploy
```

**🚀🚀🚀 Done! Your GraphQL API is now ready to use.**