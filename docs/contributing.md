# 🧬 Contributing

Thanks for your interest in contributing! Please make sure to take a moment and read through [Prisma-AppSync concept](/essentials/concept.html), as well as the following guide:

## 👉 Repository setup

We use `pnpm` as the core package manager, `yarn` and `docker` for creating the AWS CDK bundle before deployment, `zx` for running scripts, `aws` and `cdk` CLIs for deployment.

**Start with cloning the repo on your local machine:**

```bash
git clone https://github.com/maoosi/prisma-appsync.git
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

> [1] Automatically generates a playground folder (unless already existing), plus run a local GraphQL + AWS AppSync server pointing to the playground folder. This creates an ideal local dev environment that emulates Prisma-AppSync running on AWS locally. Everything inside playground is pointing local source packages.

## 👉 Sending Pull Request

### Discuss first

Before you start to work on a feature pull request, it's always better to open a feature request issue first to discuss with the maintainers whether the feature is desired and the design of those features.

### Commit convention

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

## 👉 Legal

By submitting your code to the Prisma-AppSync project, you are granting the project maintainers a right to use that code and provide it to others under the BSD 2-Clause License attached to the project. You are also certifying that you wrote it and that you are allowed to license it to us.
