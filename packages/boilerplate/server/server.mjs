#!/usr/bin/env zx

process.env.FORCE_COLOR = 3
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/dev'

await $`npx prisma generate`

cd('./.server')
await $`docker-compose up -d`

cd('../')
await $`npx prisma db push --accept-data-loss`

await $`{{ concurrentlyCmd }}`