# Contributions guide

Thanks for your interest in contributing!

## 👉 Discuss first

Before starting to work on a pull request, it's always better to open an issue first to confirm its desirability and discuss the approach with the maintainers.

## 👉 Project packages

<table>
<tr>
<td width="800px">

**`packages/generator`**

Generator for [Prisma ORM](https://www.prisma.io/), whose role is to parse your Prisma Schema and generate all the necessary components to run and deploy a GraphQL API tailored for AWS AppSync.

</td>
</tr>
<tr>
<td>

**`packages/client`**

Think of it as [Prisma Client](https://www.prisma.io/client) for GraphQL. Fully typed and designed for AWS Lambda AppSync Resolvers. It can handle CRUD operations with just a single line of code, or be fully extended.

</td>
</tr>
<tr>
<td>

**`packages/installer`**

Interactive CLI tool that streamlines the setup of new Prisma-AppSync projects, making it as simple as running `npx create-prisma-appsync-app@latest`.

</td>
</tr>
<tr>
<td>

**`packages/server`**

Local dev environment that mimics running Prisma-AppSync in production. It includes an AppSync simulator, local Lambda resolvers execution, a GraphQL IDE, hot-reloading, and authorizations.

</td>
</tr>
</table>

## 👉 Repository setup

We use `pnpm` as the core package manager, `yarn` + `docker` for creating the AWS CDK bundle before deployment, `zx` for running scripts, `aws` + `cdk` CLIs for deployment.

**Start with cloning the repo on your local machine:**

```bash
git clone https://github.com/maoosi/prisma-appsync.git
```

**Checkout the `dev` branch (working branch):**

```bash
git checkout dev
```

**Install pre-requirements:**

| Step |
|:-------------|
| 1. Install NodeJS, [latest LTS is recommended ↗](https://nodejs.org/en/about/releases/) |
| 2. Install [pnpm ↗](https://pnpm.js.org/) |
| 3. Install [yarn@1 ↗](https://classic.yarnpkg.com/en/docs/install/) |
| 4. Install [zx ↗](https://github.com/google/zx) |
| 5. Install [docker ↗](https://www.docker.com/products/docker-desktop) |
| 6. Install the [AWS CLI ↗](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) |
| 7. Install the [AWS CDK ↗](https://github.com/aws/aws-cdk) |

**Verify installation:**

```bash
node -v && pnpm --version && yarn --version && zx --version && docker --version && aws --version && cdk --version
```

**Install dependencies:**

```bash
pnpm install
```

**Run local dev playground:**

```bash
pnpm dev
```

> See list of commands below for more details about `pnpm dev`.

## 👉 Commands

| Command | Description |
| ------------- |:-------------|
| `pnpm install` | Install project dependencies. |
| `pnpm test` | Run all unit tests and e2e tests. |
| `pnpm build` | Build the entire prisma-appsync library. |
| `pnpm dev` | Creates local dev setup, useful for contributing [1]. |

> [1] Auto-generates a 'playground' folder (if not there already) and launches a local GraphQL + AWS AppSync server. This simulates the Prisma-AppSync AWS environment for local development, with 'playground' contents pointing to local source packages.

## 👉 Commit convention

We use [Conventional Commits ↗](https://www.conventionalcommits.org/) for commit messages such as:

```ts
<type>[optional scope]: <description>
```

> - Possible types: `feat` / `fix` / `chore` / `docs`
> - Possible scopes: `client` / `generator` / `cli` / `boilerplate` / `server`
> - Description: Short description, with issue number when relevant.

Here are some examples:

| Type | Commit message |
|:------------- |:------------- |
| Bug fix | `fix(client): issue #234 - JEST_WORKER_ID replaced` |
| New feature | `feat(generator): new defaultDirective parameter` |
| Routine task | `chore: deps updated to latest` |
| Docs update | `docs: fix typo inside home` |

## 👉 Coding guidelines

### ESLint

We use [ESLint ↗](https://eslint.org/) for both linting and formatting.

<table><tr><td width="500px" valign="top">

#### IDE Setup

We recommend using [VS Code ↗](https://code.visualstudio.com/) along with the [ESLint extension ↗](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

With the settings on the right, you can have auto-fix and formatting when you save the code you are editing.

</td><td width="500px"><br>

VS Code's `settings.json`

```json
{
    "editor.codeActionsOnSave": {
        "source.fixAll": false,
        "source.fixAll.eslint": true
    }
}
```

</td></tr></table>

### No Prettier

Since ESLint is already configured to format the code, there is no need to duplicate the functionality with Prettier. If you have Prettier installed in your editor, we recommend you disable it when working on the project to avoid conflict.

## 👉 License

When you contribute code to the Prisma-AppSync project, you grant the maintainers permission to use and share your code under the project's BSD 2-Clause License. You also affirm that you are the original author of the code and have the authority to license it.
