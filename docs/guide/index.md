# Getting started

[https://www.youtube.com/watch?v=k2tjpxC7mrQ](https://www.youtube.com/watch?v=k2tjpxC7mrQ)

## Installation

Run the following command and follow the prompts 🙂

```bash
npx create prisma-appsync-app
```

## Usage

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