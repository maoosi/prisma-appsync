#!/usr/bin/env zx

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = "postgresql://prisma:prisma@localhost:5433/tests"

// build local version of prisma-appsync
await $`pnpm build`

// generate prisma + prisma-appsync clients
await $`cd tests/integration && npx prisma generate`

// create a docker container in a detached state
await $`cd tests/integration && docker-compose up -d`

// apply migrations
await $`cd tests/integration && npx prisma db push --accept-data-loss`
