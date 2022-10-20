#!/usr/bin/env zx
import './env.mjs'

// build project
await $`zx scripts/build.mjs`

// path
const playgroundPath = 'playground'

// reset
if (argv?.reset) {
    console.log(chalk.blue('\nDev :: Delete existing Playground directory\n'))
    await fs.remove(playgroundPath)
}

// install
const playgroundExists = await fs.pathExists(playgroundPath)

if (!playgroundExists) {
    console.log(chalk.blue('\nDev :: Create Playground directory\n'))
    await fs.ensureDir(playgroundPath)

    console.log(chalk.blue('\nDev :: Run Prisma-AppSync Installer\n'))
    cd(playgroundPath)
    process.env.PRISMA_APPSYNC_CREATEAPP_MODE = 'dev'
    await $`node ../dist/installer`
}
else {
    console.log(chalk.blue('\nDev :: Run npx prisma generate\n'))
    cd(playgroundPath)
    await $`npx prisma generate`
}

// serve
await $`yarn serve`
