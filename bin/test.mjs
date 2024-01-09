#!/usr/bin/env zx
/* eslint-disable no-console */
import './env.mjs'

// build
await $`zx bin/build.mjs`

// prisma client for tests
console.log(chalk.blue('\n🧪 [test] run prisma generate'))
await $`npx prisma generate --schema tests/generator/schemas/crud.prisma`
await $`npx prisma generate --schema tests/generator/schemas/@gql.prisma`

// unit tests
console.log(chalk.blue('🧪 [test] run unit tests\n'))
await $`VITE_CJS_IGNORE_WARNING=true vitest run tests`
