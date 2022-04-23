#!/usr/bin/env zx
import './env.mjs'

// build project
import './build.mjs'

const playgroundPath = 'playground'
const playgroundExists = await fs.pathExists(playgroundPath)

if (!playgroundExists) {
    await fs.ensureDir(playgroundPath)
    process.env.PRISMAAPPSYNC_CREATEAPP_MODE = 'dev'
    await $`cd ${playgroundPath} && node ../dist/create-app`
}