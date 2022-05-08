#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs'
import path from 'path'
import prompts from 'prompts'
import degit from 'degit'
import execa from 'execa'
import { detect } from 'detect-package-manager'
import { cyan, yellow, bold, dim } from 'kolorist'

const gitBranch = 'maoosi/prisma-appsync#maoosi/dev'
const installPackage = 'prisma-appsync@preview'

const cwd = process.cwd()
const { version } = require('../package.json')
const isLocalDevMode = String(process.env.PRISMAAPPSYNC_CREATEAPP_MODE) === 'dev'

async function init() {
    console.log()
    console.log(`  ${cyan('◭') + yellow(' ◬')}`)
    console.log(`${bold('  Prisma-AppSync') + dim(' Installer')}  ${cyan(`v${version}`)}`)
    console.log()

    const userConfig:UserConfig = {
        root: cwd,
        targetDir: '',
        targetSchema: 'prisma/schema.prisma',
        generateSchema: false,
        initPackage: false,
        addDependencies: [],
        addDevDependencies: [],
        scripts: [],
        renames: [],
        clones: [],
        injects: [],
        packageManager: 'npm',
        recommendations: [],
    }

    const dependencies = !isLocalDevMode ? [
        { package: 'prisma', dev: true },
        { package: '@prisma/client', dev: true },
        { package: installPackage, dev: true },
    ] : [
        { package: 'prisma', dev: true },
        { package: '@prisma/client', dev: true }
    ]

    const { project } = !isLocalDevMode ? await prompts({
        type: 'text',
        name: 'project',
        message: 'Project directory (default: current dir)',
        initial: '',
    }) : { project: '' }

    if (typeof project === 'undefined') return

    userConfig.targetDir = project.trim()
    userConfig.root = path.join(cwd, userConfig.targetDir)

    userConfig.packageManager = await detect(userConfig.targetDir)

    let existingSchema: any = false
    if (fs.existsSync(path.join(userConfig.root, 'prisma', 'schema.prisma'))) {
        existingSchema = path.join('prisma', 'schema.prisma')
    } else if (fs.existsSync(path.join(userConfig.root, 'schema.prisma'))) {
        existingSchema = path.join('schema.prisma')
    }

    const { useExistingSchema } = !isLocalDevMode ? await prompts({
        type: 'confirm',
        name: 'useExistingSchema',
        initial: existingSchema ? true : false,
        message: 'Use existing `schema.prisma` file?',
    }) : { useExistingSchema: false }

    if (typeof useExistingSchema === 'undefined') return

    if (useExistingSchema) {
        const { schema } = await prompts({
            type: 'text',
            name: 'schema',
            message: 'Path to your `schema.prisma` file?',
            initial: existingSchema || userConfig.targetSchema,
        })
        userConfig.targetSchema = schema.trim()

        try {
            fs.readFileSync(path.join(userConfig.root, userConfig.targetSchema))
            userConfig.generateSchema = false
        } catch (e) {
            userConfig.generateSchema = true
        }
    } else {
        userConfig.generateSchema = true
    }

    const { createLocalDevServer } = !isLocalDevMode ? await prompts({
        type: 'confirm',
        name: 'createLocalDevServer',
        initial: true,
        message: 'Create local dev server?',
    }) : { createLocalDevServer: true }

    if (typeof createLocalDevServer === 'undefined') return

    if (createLocalDevServer) {
        const serverDir = '.server'
        
        dependencies.push({ package: 'concurrently', dev: true })
        dependencies.push({ package: 'nodemon', dev: true })
        dependencies.push({ package: 'wait-on', dev: true })
        dependencies.push({ package: 'zx', dev: true })

        userConfig.clones.push({
            from: path.join(userConfig.root, '../', 'packages/boilerplate/server'),
            to: path.join(userConfig.root, serverDir),
        })

        userConfig.scripts.push({
            name: 'serve',
            cmd: 'zx ./.server/server.mjs'
        })

        const serverTsPath = path.join(userConfig.root, serverDir, 'server.ts')
        const serverMjsPath = path.join(userConfig.root, serverDir, 'server.mjs')

        userConfig.injects.push({
            file: serverTsPath,
            find: /\.\.\/prisma\/generated\/prisma-appsync\/schema\.gql/g,
            replace: path.relative(
                path.join(userConfig.root, serverDir), 
                path.join(userConfig.root, path.dirname(userConfig.targetSchema), 'generated/prisma-appsync/schema.gql')
            ),
        })

        if (isLocalDevMode) {
            userConfig.injects.push({
                file: serverTsPath,
                find: /prisma-appsync\/dist\/appsync-server/g,
                replace: '../../dist/appsync-server',
            })
            userConfig.injects.push({
                file: serverMjsPath,
                find: /npx concurrently [^`]*/g,
                replace: `npx concurrently --kill-others --names "server,schema,packages" -c "bgBlue.black,bgYellow.black,bgGreen.black" "npx nodemon -e ts --watch './**/*' --watch './.server/server.ts' --ignore './node_modules' --ignore '**/generated/**' ./.server/server.ts" "npx nodemon -e prisma,gql,yaml --watch './**/*' --ignore './node_modules' --ignore '**/generated/**' --exec 'npx prisma generate'" "wait-on tcp:4000 && npx nodemon -e ts --watch '../packages/**/*' --exec 'cd ../ && pnpm build && echo \'Running a GraphQL API server at http://localhost:4000/graphql\'"`,
            })
        }
    }

    let packageFile:any = false

    try {
        packageFile = JSON.parse(fs.readFileSync(path.join(userConfig.root, 'package.json'), 'utf8'))
    } catch (e) {
        userConfig.initPackage = true
    }

    for (let i = 0; i < dependencies.length; i++) {
        const dep = dependencies[i]

        const isInstalled =
            typeof packageFile.dependencies !== 'undefined' && typeof packageFile.dependencies[dep.package] !== 'undefined'
        const isDevInstalled =
            typeof packageFile.devDependencies !== 'undefined' &&
            typeof packageFile.devDependencies[dep.package] !== 'undefined'

        if (!packageFile || (!isInstalled && !isDevInstalled)) {
            if (dep.dev) userConfig.addDevDependencies.push(dep.package)
            else userConfig.addDependencies.push(dep.package)
        }
    }

    const tmpDir = path.join(userConfig.root, '.prisma-appsync')

    if (!isLocalDevMode) {
        const emitter = degit(gitBranch, {
            cache: false,
            force: true,
            verbose: true,
        })

        await emitter.clone(tmpDir)

        userConfig.clones.push({
            from: path.join(userConfig.root, '.prisma-appsync', 'packages/boilerplate/cdk'),
            to: path.join(userConfig.root, 'cdk'),
        })
        userConfig.clones.push({
            from: path.join(userConfig.root, '.prisma-appsync', 'packages/boilerplate/handler.ts'),
            to: path.join(userConfig.root, 'handler.ts'),
        })

        if (userConfig.generateSchema) {
            userConfig.clones.push({
                from: path.join(userConfig.root, '.prisma-appsync', 'packages/boilerplate/prisma/schema.prisma'),
                to: path.join(userConfig.root, userConfig.targetSchema),
            })
        } else {
            const schemaPath = path.join(userConfig.root, userConfig.targetSchema)
            const schemaContent = fs.readFileSync(schemaPath, 'utf-8')

            if (!schemaContent.match(/generator\s+appsync\s+{/g)) {
                userConfig.injects.push({
                    file: schemaPath,
                    find: /((?: )*generator\s+client\s+{[^}]*})/g,
                    replace: `$1\n\ngenerator appsync {\n\tprovider = "prisma-appsync"\n}`,
                })
            }
            if (!schemaContent.match(/binaryTargets\s*=\s*\[(.)*\]/g)) {
                userConfig.injects.push({
                    file: schemaPath,
                    find: /( *)provider\s*=\s*"prisma-client-js"(?:\r|\n)/g,
                    replace: `$1provider = "prisma-client-js"\n$1binaryTargets = ["native", "rhel-openssl-1.0.x"]\n`,
                })
            } else {
                userConfig.recommendations.push(
                    'Make sure the `binaryTargets` inside your `schema.prisma` file include both "native" and "rhel-openssl-1.0.x"',
                )
            }
        }
    } else {
        userConfig.clones.push({
            from: path.join(userConfig.root, '../', 'packages/boilerplate/cdk'),
            to: path.join(userConfig.root, 'cdk'),
        })
        userConfig.clones.push({
            from: path.join(userConfig.root, '../', 'packages/boilerplate/handler.ts'),
            to: path.join(userConfig.root, 'handler.ts'),
        })
        userConfig.clones.push({
            from: path.join(userConfig.root, '../', 'packages/boilerplate/prisma/schema.prisma'),
            to: path.join(userConfig.root, userConfig.targetSchema),
        })
        userConfig.injects.push({
            file: path.join(userConfig.root, userConfig.targetSchema),
            find: /((?: )*generator\s+appsync\s+{[^}]*})/g,
            replace: `generator appsync {\n\tprovider = "../dist/generator.js"\n}`,
        })
    }

    const timestamp = new Date().getTime()

    for (let j = 0; j < userConfig.clones.length; j++) {
        const from = userConfig.clones[j].to

        if (fs.existsSync(from)) {
            const parts = from.split('/')
            const to = [
                ...parts.splice(0, parts.length > 1 ? parts.length - 1 : 0),
                ...['old.' + timestamp + '.' + parts[parts.length - 1]],
            ].join('/')

            userConfig.renames.push({ from, to })
        }
    }

    await execUserConfig(userConfig)

    if (!isLocalDevMode) removeDir(tmpDir)
}

async function execUserConfig(userConfig: UserConfig) {
    // console.log(userConfig)

    // rename
    for (let i = 0; i < userConfig.renames.length; i++) {
        const file = userConfig.renames[i]
        rename(file.from, file.to)
    }

    // clone
    for (let j = 0; j < userConfig.clones.length; j++) {
        const clone = userConfig.clones[j]
        copy(clone.from, clone.to)
    }

    // inject
    for (let k = 0; k < userConfig.injects.length; k++) {
        const inject = userConfig.injects[k]
        replaceInFile(inject.file, inject.find, inject.replace)
    }

    const add = userConfig.packageManager === 'npm' ? 'install' : 'add'
    const saveDev = userConfig.packageManager === 'npm' ? '--save-dev' : '-D'

    // init
    if (userConfig.initPackage) {
        await execa(userConfig.packageManager, ['init', '-y'], {
            stdio: 'inherit',
            cwd: userConfig.root,
        })
    }

    // install
    if (userConfig.addDependencies.length > 0) {
        await execa(userConfig.packageManager, [add, ...userConfig.addDependencies], {
            stdio: 'inherit',
            cwd: userConfig.root,
        })
    }
    if (userConfig.addDevDependencies.length > 0) {
        await execa(userConfig.packageManager, [add, ...userConfig.addDevDependencies, saveDev], {
            stdio: 'inherit',
            cwd: userConfig.root,
        })
    }

    // pkg
    if (userConfig.scripts.length > 0) {
        const pkg:any = JSON.parse(fs.readFileSync(path.join(userConfig.root, 'package.json'), 'utf-8'))

        if (typeof pkg?.scripts === 'undefined') pkg['scripts'] = {}

        userConfig.scripts.forEach((script) => {
            if (pkg?.scripts?.[script.name]) {
                pkg.scripts[`old.${script.name}`] = pkg.scripts[script.name]
            }
            pkg.scripts[script.name] = script.cmd
        })

        fs.writeFileSync(path.join(userConfig.root, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8')
    }

    // generate
    await execa('npx', ['prisma', 'generate'], { stdio: 'inherit', cwd: userConfig.root })

    // info
    for (let l = 0; l < userConfig.recommendations.length; l++) {
        const reco = userConfig.recommendations[l]
        console.log(bold(cyan('  Note: ')) + reco + dim(' ...'))
    }
}

function rename(before: string, after: string) {
    fs.renameSync(before, after)
}

function copy(src: string, dest: string) {
    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        copyDir(src, dest)
    } else {
        const parentDir = path.dirname(dest)
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir)
        fs.copyFileSync(src, dest)
    }
}

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true })
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file)
        const destFile = path.resolve(destDir, file)
        copy(srcFile, destFile)
    }
}

function emptyDir(dir: string) {
    if (!fs.existsSync(dir)) return

    for (const file of fs.readdirSync(dir)) {
        const abs = path.resolve(dir, file)
        // baseline is Node 12 so can't use rmSync :(
        if (fs.lstatSync(abs).isDirectory()) {
            emptyDir(abs)
            fs.rmdirSync(abs)
        } else {
            fs.unlinkSync(abs)
        }
    }
}

function replaceInFile(file: string, findRegex: RegExp, replace: string) {
    const content = fs.readFileSync(file, 'utf-8')
    fs.writeFileSync(file, content.replace(findRegex, replace), 'utf-8')
}

function removeDir(dir: string) {
    emptyDir(dir)
    fs.rmdirSync(dir)
}

init().catch((e) => {
    console.error(e)
    process.exit()
})

type UserConfig = {
    root: string,
    targetDir: any,
    targetSchema: string,
    generateSchema: boolean,
    initPackage: boolean,
    addDependencies: string[],
    addDevDependencies: string[],
    scripts: { name: string, cmd:string }[],
    renames: { from: string, to:string }[],
    clones: { from: string, to:string }[],
    injects: { file: string, find: RegExp, replace:string }[],
    packageManager: 'npm' | 'yarn' | 'pnpm',
    recommendations: string[],
}
