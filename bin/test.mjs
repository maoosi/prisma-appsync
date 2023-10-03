#!/usr/bin/env zx
/* eslint-disable no-console */
import './env.mjs'

// build
await $`zx bin/build.mjs`

// prisma client for tests
console.log(chalk.blue('\nTest :: Generate Schemas\n'))
await $`npx prisma generate --schema tests/generator/schemas/crud.prisma`
await $`npx prisma generate --schema tests/generator/schemas/@gql.prisma`

// unit tests
console.log(chalk.blue('\nTest :: Unit\n'))
await $`vitest run tests`
