# Deploy

## 👉 1. Prepare your local machine

Make sure to install the below on your local machine:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)
- [Docker](https://docs.docker.com/get-docker/)

Then [configure your local environment](https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-environment) with the AWS Account of your choice.

## 👉 2. Setup a Database

Setup the database of your choice. It doesn't have to be hosted on Amazon AWS, you can use any database supported by Prisma. If you are not sure what to use, we recommend using [PlanetScale](https://planetscale.com) and read the following [integration guide](https://planetscale.com/docs/tutorials/prisma-quickstart).

## 👉 3. Deploy on AWS

Run the below CDK CLI command:

> Where `DATABASE_URL` is your own [database connection url](https://www.prisma.io/docs/reference/database-reference/connection-urls).

```bash
DATABASE_URL=mysql://xxx yarn deploy
```

**🚀 Done! Your GraphQL API is now ready to use.**
