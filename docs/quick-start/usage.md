# Usage

## 👉 Folder structure

Using the CLI Installer (recommended):

```bash
project/
  |__ handler.ts  # lambda function handler (API resolver)
  |__ server.ts   # local server (for dev)
  |__ cdk/        # AWS CDK deploy boilerplate
  |__ prisma/
    |__ schema.prisma  # prisma schema (data source)
    |__ generated/     # auto-generated after each `npx prisma generate`
```

## 👉 Generating the API

Run the below command from the project root directory:

```bash
npx prisma generate
```

After each `prisma generate`, files inside `prisma/generated` will be auto-generated.

## 👉 Local dev server

Run the local server and try Prisma-AppSync locally (only if using the CLI Installer):

```bash
yarn run dev
```

This will automatically push your Prisma Schema changes to a SQLite database, as well as launch a local GraphQL IDE server (with auto-reload and TS support).
