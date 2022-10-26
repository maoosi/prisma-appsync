#!/usr/bin/env zx
/* eslint-disable @typescript-eslint/no-unused-vars */
import Listr from 'listr'
import prompts from 'prompts'

await $`zx scripts/env.mjs`
await $`zx scripts/test.mjs`

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

async function publishCore({ publishVersion, tag }) {
    console.log('# Core')

    await new Listr([
        {
            title: 'Cleansing package.json',
            task: async () => {
                await $`node scripts/publish/_pkg.core.cleanse`
            },
        },
        {
            title: `Setting publish version to ${publishVersion}`,
            task: async () => {
                const pkg = await fs.readJson('./package.json')
                pkg.version = publishVersion
                await fs.writeJson('./package.json', pkg)

                const pkgAfter = await fs.readJson('./package-afterPublish.json')
                pkgAfter.version = publishVersion
                await fs.writeJson('./package-afterPublish.json', pkgAfter)
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

async function publishInstaller({ publishVersion, tag }) {
    console.log('# Installer')

    await new Listr([
        {
            title: 'Copy + Cleanse package.json',
            task: async () => await $`node scripts/publish/_pkg.installer.cleanse`,
        },
        {
            title: `Setting publish version to ${publishVersion}`,
            task: async () => {
                const pkg = await fs.readJson('./dist/installer/package.json')
                pkg.version = publishVersion
                await fs.writeJson('./dist/installer/package.json', pkg)
            },
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
    const { publishList } = await prompts({
        type: 'multiselect',
        name: 'publishList',
        message: 'Select packages to publish',
        choices: [
            { title: 'Core', value: 'core', selected: true },
            { title: 'Installer', value: 'installer', selected: true },
        ],
    })

    if (publishList.includes('core'))
        await publishCore(publishConfig)

    if (publishList.includes('installer'))
        await publishInstaller(publishConfig)
}
