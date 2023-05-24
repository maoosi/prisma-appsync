#!/usr/bin/env zx
import './env.mjs'

// build
await $`zx scripts/build.mjs`

// prisma client for tests
console.log(chalk.blue('\nTest :: Generate Prisma Client\n'))
await $`npx prisma generate --schema tests/prisma/schema.prisma`

// unit tests
console.log(chalk.blue('\nTest :: Unit\n'))
await $`vitest run tests`

