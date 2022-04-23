#!/usr/bin/env zx
import './env.mjs'

// set DATABASE_URL env variable to docker instance
process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

// install boilerplate dependencies using Yarn
console.log(chalk.blue('\nPost Install :: CDK\n'))
await $`cd packages/boilerplate/cdk && yarn install`
