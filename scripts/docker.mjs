#!/usr/bin/env zx
import './env.mjs'

// build local version of Prisma-AppSync
import './build.mjs'

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// generate prisma + prisma-appsync clients
console.log(chalk.blue('\nDocker :: Generate local Prisma schema + client\n'))
await $`cd tests/e2e && npx prisma generate`

// create a docker container in a detached state
console.log(chalk.blue('\nDocker :: Run docker container with local DB\n'))
await $`cd tests/e2e && docker-compose up -d`

// apply migrations to local DB
console.log(chalk.blue('\nDocker :: Apply migrations on local DB\n'))
await $`cd tests/e2e && npx prisma db push --accept-data-loss`
