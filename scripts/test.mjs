#!/usr/bin/env zx
import './env.mjs'

// build
import './build.mjs'

// unit tests
console.log(chalk.blue('\nTest :: Client\n'))
await $`vitest run tests/client/*.spec.ts`

// e2e tests
// console.log(chalk.blue('Test :: e2e\n'))
// await $`print hello`
