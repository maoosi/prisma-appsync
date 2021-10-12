#!/usr/bin/env zx

// run tests (incl. build)
import './test.mjs'

// publish NPM package
console.log(chalk.blue('Publish :: NPM package\n'))
// await $`npm publish`
