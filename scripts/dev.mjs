#!/usr/bin/env zx
import './env.mjs'

// build project
import './build.mjs'

const playgroundPath = 'playground'
const playgroundExists = await fs.pathExists(playgroundPath)

if (!playgroundExists) {
    await fs.ensureDir(playgroundPath)
    process.env.PRISMAAPPSYNC_CREATEAPP_MODE = 'dev'
    cd(playgroundPath)
    await $`node ../dist/create-app`
} else {
    cd(playgroundPath)
    await $`npx prisma generate`
}

cd('../')

process.env.DATABASE_URL = 'postgresql://prisma:prisma@localhost:5433/tests'

await $`npx concurrently --kill-others --names "server,packages" -c "bgBlue.black,bgYellow.black" "npx nodemon --watch './playground/*' ./playground/server.ts" "wait-on ./dist/appsync-server/index.d.ts && npx nodemon -e ts --watch './packages/client/src/*' --watch './packages/generator/src/*' --exec 'pnpm build'"`