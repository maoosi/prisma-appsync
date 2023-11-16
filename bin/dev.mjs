#!/usr/bin/env zx
import './env.mjs'

// path
const playgroundPath = 'playground'

// reset
if (argv?.reset) {
    console.log(chalk.blue('\n💻 [dev] reset `playground` dir'))
    await fs.remove(playgroundPath)
}

// build project
await $`zx bin/build.mjs`

// install
const playgroundExists = await fs.pathExists(playgroundPath)
console.log('')

if (!playgroundExists) {
    console.log(chalk.blue('💻 [dev] create `playground` dir'))
    await fs.ensureDir(playgroundPath)

    console.log(chalk.blue('💻 [dev] run installer'))
    cd(playgroundPath)
    process.env.INSTALL_MODE = 'contributor'
    await $`node ../dist/installer/bin/index.js`
}
else {
    console.log(chalk.blue('💻 [dev] run prisma generate\n'))
    cd(playgroundPath)
    await $`npx prisma generate`
}

// start dev server
console.log(chalk.blue('💻 [dev] start dev server\n'))
await $`yarn dev`
