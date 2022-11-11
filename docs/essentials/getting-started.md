# ⚡️ Getting started

Please make sure to read [Prisma-AppSync core concepts](/essentials/concept) first.

## 👉 Installation

### Method 1: Using the CLI Installer (recommended)

Run the following command and follow the prompts 🙂

```bash
npx create-prisma-appsync-app@latest
```

🚀🚀🚀 Done! 

### Method 2: Manual Install

::: details Click to reveal

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

:::

## 👉 Usage

::: warning NOTE
Folder structure, local server access, and deployment instructions might differ depending on your installation choices, or if installing Prisma-AppSync manually.
:::

### Folder structure

After running the installation command, you should end up with the following structure:

```bash
project/
  |__ handler.ts  # lambda function handler (API resolver)
  |__ server.ts   # local server (for dev)
  |__ cdk/        # AWS CDK deploy boilerplate
  |__ prisma/
    |__ schema.prisma  # prisma schema (data source)
    |__ generated/     # auto-generated after each `npx prisma generate`
```

### Generating the API

All the files inside the `prisma/generated` directory will be auto-generated each time you run `npx prisma generate`. These files contain everything required to deploy and run your API.

Updating fields or adding a new model? Update your `schema.prisma` file, then run:

```bash
npx prisma generate
```

### Local server

To run the local server shipped with Prisma-AppSync, just run the below command:

```bash
yarn run dev
```

> By default, this will synchronize your Prisma Schema will a local SQLite database and launch a local GraphQL IDE server (with auto-reload and TS support).

### Deploying the API

Make sure to install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), the [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install), and [Docker](https://docs.docker.com/get-docker/) on your local machine. Configure your local environment to use your AWS Account: [refer to the guide here](https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-environment). 

Then just run the below CDK CLI command:

```bash
DATABASE_URL=[url] yarn deploy
```

> Replace `[url]` with your [database connection url](https://www.prisma.io/docs/reference/database-reference/connection-urls)

**🚀🚀🚀 Done! Your GraphQL API is now ready to use.**