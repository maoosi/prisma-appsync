#!/usr/bin/env zx

// build
import './build.mjs'

// unit tests
console.log(chalk.blue('\nTest :: Unit\n'))
await $`jest tests/unit/*.spec.ts --verbose --expand`

// integration tests
console.log(chalk.blue('Test :: Integration\n'))
// await $`print hello`

// copy examples API docs into package docs
// await $`cp test/generated/prisma-appsync/docs/Post.md docs/demo/_post.md && cp test/generated/prisma-appsync/docs/User.md docs/demo/_user.md`
