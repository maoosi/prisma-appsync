#!/usr/bin/env zx

// run tests (incl. build)
import './test.mjs'

// cleanse package.json file
console.log(chalk.blue('\nPreview :: Cleanse package.json\n'))
await $`node scripts/_pkg.cleanse`

// publish NPM package
console.log(chalk.blue('\nPreview :: Publish NPM package\n'))
// await $`npm publish --tag preview --dry-run`
await $`npm publish --tag preview`

// restore package.json file
console.log(chalk.blue('\nPreview :: Restore package.json\n'))
await $`node scripts/_pkg.restore`
