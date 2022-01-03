#!/usr/bin/env zx

// run tests (incl. build)
import './test.mjs'

// publish NPM package
console.log(chalk.blue('\nPublish :: NPM package\n'))
// await $`npm publish`
