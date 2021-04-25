# Contributing

## Bug Reports and Feature Requests

If you have found a bug or have a feature request then please create an issue in this repository (please search first in case a similar issue already exists).

## Code

### General Prerequisites

1. Node.js, [latest LTS is recommended](https://nodejs.org/en/about/releases/)
2. Install [`pnpm`](https://pnpm.js.org/) (for installing dependencies)
3. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) (for deploying on AWS)
4. Install the [AWS CDK](https://github.com/aws/aws-cdk) (for deploying on AWS)
5. Install [`yarn@1`](https://classic.yarnpkg.com/en/docs/install/) (for building the project before deploy)
6. Install [`docker`](https://www.docker.com/products/docker-desktop) (for bundling the project before deploy)

### Dev Setup

To setup the project for local development, follow these steps:

```bash
# clone the repo
git clone https://github.com/maoosi/prisma-appsync.git

# install dependencies
cd prisma-appsync
pnpm install

# install cdk boilerplate dependencies
pnpm install:boilerplate
```

### Run Tests

To run the automated tests, follow these steps:

```bash
# build project and run tests
pnpm test
```

### Test on AWS

To quickly create a test app using your local `prisma-appsync` directory, follow these steps:

```bash
# make sure to run from the same level as `prisma-appsync` dir
[ -d "./prisma-appsync" ] && echo "You are at the right location." || echo "Wrong location. Make sure to be at the same level as prisma-appsync dir."

# run the generator using the --test parameter
yarn create prisma-appsync-app . --test

# cd into the new test app folder
cd prisma-appsync-testapp-<timestamp>

# run prisma generate and deploy on AWS
yarn deploy
```

> Please note that `yarn create prisma-appsync-app . --test` will use a special version of the Prisma-AppSync boilerplate that will automatically link the prisma-appsync dependency to your local dev setup (`prisma-appsync` directory located at the same level).

## Legal

By submitting your code to the Prisma-AppSync project, you are granting the project maintainers a right to use that code and provide it to others under the BSD 2-Clause License attached to the project. You are also certifying that you wrote it, and that you are allowed to license it to us.
