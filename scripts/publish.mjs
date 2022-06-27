#!/usr/bin/env zx
import Listr from 'listr'
import prompts from 'prompts'

await $`zx scripts/env.mjs`
$.verbose = false

const { tag } = await prompts({
    type: 'select',
    name: 'tag',
    message: 'Select publish tag',
    choices: [
        { title: 'preview', value: 'preview' },
        { title: 'beta', value: 'beta' },
        { title: 'rc', value: 'rc' },
        { title: 'latest', value: 'latest' },
    ],
    initial: 0,
})

if (!tag) process.exit()

const latestPublished = String(await $`npm show prisma-appsync@${tag} version`).trim()

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

if (!publishVersion || publishVersion === latestPublished) process.exit()

const { versionOk } = await prompts({
    type: 'confirm',
    name: 'versionOk',
    message: `Run "npm publish prisma-appsync --tag ${tag}" with pkg version "${publishVersion}"?`,
    initial: false,
})

if (versionOk) {
    await new Listr([
        {
            title: 'Running tests',
            task: async () => await $`zx scripts/test.mjs`,
        },
        {
            title: 'Cleansing package.json',
            task: async () => await $`node scripts/_pkg.cleanse`,
        },
        {
            title: `Setting publish version to ${publishVersion}`,
            task: async () => {
                let pkg = await fs.readJson('./package.json')
                pkg.version = publishVersion
                await fs.writeJson('./package.json', pkg)
            },
        },
        {
            title: 'Publishing on NPM',
            task: async () => await $`npm publish prisma-appsync --tag ${tag}`,
        },
        {
            title: 'Restoring package.json',
            task: async () => await $`node scripts/_pkg.restore`,
        },
    ]).run()
}
