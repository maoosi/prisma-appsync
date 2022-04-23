#!/usr/bin/env zx
import './env.mjs'

// build
import './build.mjs'

// unit tests
console.log(chalk.blue('\nTest :: Unit\n'))
await $`vitest run tests/unit/*.spec.ts`

// e2e tests
// console.log(chalk.blue('Test :: e2e\n'))
// await $`print hello`
