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
    // await $`npx prisma generate`
}

// process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/playground'

// console.log(chalk.blue('\nDev :: Run Docker\n'))
// await $`docker-compose up -d`

// console.log(chalk.blue('\nDev :: Sync DB\n'))
// await $`npx prisma db push --accept-data-loss`

// cd('../')

// console.log(chalk.blue('\nDev :: Run local server\n'))
// await $`npx concurrently --kill-others --names "server,packages" -c "bgBlue.black,bgYellow.black" "npx nodemon --watch './playground/*' ./playground/server.ts" "wait-on ./dist/appsync-server/index.d.ts && npx nodemon -e ts --watch './packages/client/src/*' --watch './packages/generator/src/*' --exec 'pnpm build'"`