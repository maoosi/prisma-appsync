#!/usr/bin/env zx
import './env.mjs'

console.log(chalk.blue('\nCleans :: Deleting all `node_modules` folders\n'))
await $`find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Deleting all `dist` folders\n'))
await $`find . -name 'dist' -type d -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Deleting all `cdk.out` folders\n'))
await $`find . -name 'cdk.out' -type d -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Deleting all `generated` folders\n'))
await $`find . -name 'generated' -type d -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Deleting all `yarn.lock` files\n'))
await $`find . -name 'yarn.lock' -type f -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Deleting all `pnpm-lock.yaml` files\n'))
await $`find . -name 'pnpm-lock.yaml' -type f -prune -exec rm -rf '{}' +`

console.log(chalk.blue('\nCleans :: Re-installing all dependencies\n'))
await $`pnpm install`
