#!/usr/bin/env zx

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// install boilerplate dependencies using Yarn
console.log(chalk.blue('Post Install :: CDK\n'))
await $`cd packages/boilerplate/cdk && yarn install`

// install boilerplate dependencies using Yarn
console.log(chalk.blue('Post Install :: Create-App\n'))
await $`cd packages/create-app && yarn install`

// launch docker + reset db
import './docker.mjs'
