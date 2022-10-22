#!/usr/bin/env zx

process.env.FORCE_COLOR = 3
process.env.DATABASE_URL = 'file:dev.db'

if ((await fs.pathExists('docker-compose.yml')))
    await $`docker-compose up -d`

await $`npx prisma generate`
await $`npx prisma db push --accept-data-loss`
await $`npx ts-node-dev {{ relativePrismaAppSyncServerPath }} --schema {{ relativeGqlSchemaPath }}`
