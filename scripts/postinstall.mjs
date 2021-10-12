#!/usr/bin/env zx

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// install boilerplate dependencies using Yarn
console.log(chalk.blue('Post Install :: Boilerplate\n'))
await $`cd boilerplate/cdk && yarn install`

// build local version of Prisma-AppSync
import './build.mjs'

// generate prisma + prisma-appsync clients
console.log(chalk.blue('Post Install :: Generate local Prisma schema + client\n'))
await $`cd tests/integration && npx prisma generate`

// create a docker container in a detached state
console.log(chalk.blue('Post Install :: Run docker container with local DB\n'))
await $`cd tests/integration && docker-compose up -d`

// apply migrations to local DB
console.log(chalk.blue('Post Install :: Apply migrations on local DB\n'))
await $`cd tests/integration && npx prisma db push --accept-data-loss`
