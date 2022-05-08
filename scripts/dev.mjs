#!/usr/bin/env zx
import './env.mjs'

// build project
import './build.mjs'

const playgroundPath = 'playground'
const playgroundExists = await fs.pathExists(playgroundPath)

if (!playgroundExists) {
    console.log(chalk.blue('\nDev :: Create Playground directory\n'))
    await fs.ensureDir(playgroundPath)
    process.env.PRISMAAPPSYNC_CREATEAPP_MODE = 'dev'
    cd(playgroundPath)
    console.log(chalk.blue('\nDev :: Run Prisma-AppSync Installer\n'))
    await $`node ../dist/create-app`
} else {
    console.log(chalk.blue('\nDev :: Run npx prisma generate\n'))
    cd(playgroundPath)
    await $`npx prisma generate`
}

await $`yarn serve`