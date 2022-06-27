# 🧬 Contributing

## 👉 Bug Reports and Feature Requests

If you have found a bug or have a feature request then please create an issue in this repository (please search first in case a similar issue already exists).

## 👉 Code

### General Prerequisites

1. Install NodeJS, [latest LTS is recommended](https://nodejs.org/en/about/releases/)
2. Install [pnpm](https://pnpm.js.org/) (for installing dependencies)
3. Install [yarn@1](https://classic.yarnpkg.com/en/docs/install/) (for building the project before deploy)
4. Install [zx](https://github.com/google/zx) (for running project scripts)
5. Install [docker](https://www.docker.com/products/docker-desktop) (for bundling the project before deploy and local server)
6. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) (for deploying on AWS)
7. Install the [AWS CDK](https://github.com/aws/aws-cdk) (for deploying on AWS)

**Verify installation:**

```bash
node -v && pnpm --version && yarn --version && zx --version && docker --version && aws --version && cdk --version
```

### Dev Setup

```graphql
# clone the repo
git clone https://github.com/maoosi/prisma-appsync.git

# install dependencies
pnpm install

# run local dev playground
pnpm dev
```

### Helpful commands

| Command | Description |
| ------------- |:-------------:|
| `pnpm install` | Install project dependencies. |
| `pnpm test` | Run all unit tests and e2e tests. |
| `pnpm build` | Build the entire prisma-appsync library. |
| `pnpm dev` | Creates local dev setup, useful for contributing [1]. |

> [1] Automatically generates a playground folder (unless already existing), plus run a local GraphQL + AWS AppSync server pointing to the playground folder. This creates an ideal local dev environment that emulates Prisma-AppSync running on AWS locally. Everything inside playground is pointing local source packages.

## 👉 Legal

By submitting your code to the Prisma-AppSync project, you are granting the project maintainers a right to use that code and provide it to others under the BSD 2-Clause License attached to the project. You are also certifying that you wrote it, and that you are allowed to license it to us.