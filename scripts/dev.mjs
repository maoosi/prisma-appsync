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
    process.env.INSTALL_MODE = 'contrib'
    await $`node ../dist/installer/bin/index.js`
}
else {
    console.log(chalk.blue('\nDev :: Run npx prisma generate\n'))
    cd(playgroundPath)
    await $`npx prisma generate`
}

// start dev server
await $`yarn dev`
