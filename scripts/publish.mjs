#!/usr/bin/env zx
/* eslint-disable @typescript-eslint/no-unused-vars */

import Listr from 'listr'
import prompts from 'prompts'

await $`zx scripts/env.mjs`

$.verbose = false

async function getPublishConfig() {
    const { tag } = await prompts({
        type: 'select',
        name: 'tag',
        message: 'Select publish tag',
        choices: [
            { title: 'preview', value: 'preview' },
            { title: 'latest', value: 'latest' },
        ],
        initial: 0,
    })

    if (!tag)
        process.exit()

    let latestPublished = '0.0.9'

    try {
        latestPublished = String(await $`npm show prisma-appsync@${tag} version`)?.trim()
    }
    catch (err) {
        try { latestPublished = String(await $`npm show prisma-appsync version`)?.trim() }
        catch (err) {}
    }

    const minorPos = latestPublished.lastIndexOf('.')

    const possibleFutureVersion = `${latestPublished.slice(0, minorPos)}.${
        parseInt(latestPublished.slice(minorPos + 1)) + 1
    }`

    const { publishVersion } = await prompts({
        type: 'text',
        name: 'publishVersion',
        message: `Enter new version for @${tag}? (latest = "${latestPublished}")`,
        initial: possibleFutureVersion,
    })

    if (!publishVersion || publishVersion === latestPublished)
        process.exit()

    const { versionOk } = await prompts({
        type: 'confirm',
        name: 'versionOk',
        message: `Run "pnpm publish --tag ${tag} --no-git-checks" with pkg version "${publishVersion}"?`,
        initial: false,
    })

    return {
        versionOk,
        publishVersion,
        tag,
    }
}

async function publishCore({ tag }) {
    console.log('Publishing Core...')

    await new Listr([
        {
            title: 'Cleansing package.json',
            task: async () => {
                await $`node scripts/publish/_pkg.core.cleanse`
            },
        },
        {
            title: `Publishing on NPM with tag ${tag}`,
            task: async () => await $`pnpm publish --tag ${tag} --no-git-checks`,
        },
        {
            title: 'Restoring package.json',
            task: async () => await $`node scripts/publish/_pkg.core.restore`,
        },
    ]).run().catch((err) => {
        console.error(err)
    })
}

async function publishInstaller({ tag }) {
    console.log('Publishing Installer...')

    await new Listr([
        {
            title: 'Copy + Cleanse package.json',
            task: async () => await $`node scripts/publish/_pkg.installer.cleanse`,
        },
        {
            title: 'Publishing on NPM',
            task: async () => await $`cd ./dist/installer/ && pnpm publish --tag ${tag} --no-git-checks`,
        },
    ]).run().catch((err) => {
        console.error(err)
    })
}

const publishConfig = await getPublishConfig()

if (publishConfig.versionOk) {
    const corePkgFile = './package.json'
    const installerPkgFile = './packages/installer/package.json'

    // change package.json versions
    console.log(`\nSetting publish version to ${publishConfig.publishVersion}...`)
    const corePkg = await fs.readJson(corePkgFile)
    const installerPkg = await fs.readJson(installerPkgFile)
    corePkg.version = publishConfig.publishVersion
    installerPkg.version = publishConfig.publishVersion
    await fs.writeJson(corePkgFile, corePkg, { spaces: 4 })
    await fs.writeJson(installerPkgFile, installerPkg, { spaces: 4 })

    // preview?
    if (publishConfig.tag === 'preview')
        process.env.COMPILE_MODE = "preview"

    // build + test
    console.log('Building + Testing...')
    await $`zx scripts/test.mjs`

    // publish packages
    await publishCore(publishConfig)
    await publishInstaller(publishConfig)
    console.log('Done!')
}
