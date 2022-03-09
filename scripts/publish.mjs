#!/usr/bin/env zx

// run tests (incl. build)
import './test.mjs'

// cleanse package.json file
console.log(chalk.blue('\nPublish :: Cleanse package.json\n'))
await $`node scripts/_pkg.cleanse`

// publish NPM package
console.log(chalk.blue('\nPublish :: Publish NPM package\n'))
await $`npm publish --dry-run`

// restore package.json file
console.log(chalk.blue('\nPublish :: Restore package.json\n'))
await $`node scripts/_pkg.restore`
