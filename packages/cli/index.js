#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const { version } = require('./package.json')

// @ts-check
const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const degit = require('degit')
const { detect } = require('detect-package-manager')
const { blue, yellow, bold, dim } = require('kolorist')

const cwd = process.cwd()

async function init() {
    console.log()
    console.log(`  ${blue('◭') + yellow(' ◬')}`)
    console.log(`${bold('  Prisma-AppSync') + dim(' Creator')}  ${blue(`v${version}`)}`)
    console.log()

    const userConfig = {
        targetDir: '',
        targetSchema: 'prisma/schema.prisma',
        generateSchema: false,
        addDependencies: [],
        addDevDependencies: [],
        renames: [],
        packageManager: 'npm',
    }

    userConfig.packageManager = await detect()

    const dependencies = [
        { package: 'prisma', dev: true },
        { package: '@prisma/client', dev: true },
        { package: 'prisma-appsync', dev: true },
    ]

    const { project } = await prompts({
        type: 'text',
        name: 'project',
        message: 'Project directory (default: current dir)',
        initial: '',
    })

    userConfig.targetDir = project.trim()

    const { yes } = await prompts({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message: 'Already existing `schema.prisma` file?',
    })

    if (yes) {
        const { schema } = await prompts({
            type: 'text',
            name: 'schema',
            message: 'Path to your `schema.prisma` file?',
            initial: userConfig.targetSchema,
        })

        try {
            package = fs.readFileSync(path.join(cwd, userConfig.targetDir, schema.trim()))
            userConfig.targetSchema = schema.trim()
        } catch (e) {
            userConfig.generateSchema = true
        }
    } else {
        userConfig.generateSchema = true
    }

    let package = false

    try {
        package = fs.readFileSync(path.join(cwd, userConfig.targetDir, 'package.json'))
    } catch (e) {}

    for (let i = 0; i < dependencies.length; i++) {
        const dep = dependencies[i]

        const isInstalled =
            typeof package.dependencies !== 'undefined' && typeof package.dependencies[dep.package] !== 'undefined'
        const isDevInstalled =
            typeof package.devDependencies !== 'undefined' &&
            typeof package.devDependencies[dep.package] !== 'undefined'

        if (!package || (!isInstalled && !isDevInstalled)) {
            if (dep.dev) userConfig.addDevDependencies.push(dep.package)
            else userConfig.addDependencies.push(dep.package)
        }
    }

    const emitter = degit('maoosi/prisma-appsync#alpha', {
        cache: false,
        force: true,
        verbose: true,
    })

    await emitter.clone(path.join(cwd, userConfig.targetDir, '.prisma-appsync'))

    const clones = [
        {
            from: path.join(cwd, userConfig.targetDir, '.prisma-appsync', 'packages/cli/cdk'),
            to: path.join(cwd, userConfig.targetDir, 'cdk'),
        },
        {
            from: path.join(cwd, userConfig.targetDir, '.prisma-appsync', 'packages/cli/kit/handler.ts'),
            to: path.join(cwd, userConfig.targetDir, 'handler.ts'),
        },
    ]

    for (let j = 0; j < clones.length; j++) {
        const from = clones[j].to

        if (fs.existsSync(from)) {
            const parts = from.split('/')
            const to = [
                ...parts.splice(0, parts.length > 1 ? parts.length - 1 : 0),
                ...['backup.' + parts[parts.length - 1]],
            ].join('/')

            userConfig.renames.push({ from, to })
        }
    }

    console.log(userConfig)
}

init().catch((e) => {
    console.error(e)
})
