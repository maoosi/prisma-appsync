/* eslint-disable no-console */

import path from 'path'
import fs from 'fs-extra'
import prompts from 'prompts'
import degit from 'degit'
import { execa } from 'execa'
import { detect as detectPackageManager } from 'detect-package-manager'
import { bold, cyan, dim } from 'kolorist'

export class Installer {
    private gitBranch: string
    private installPackage: string
    private cwd: string
    private isContributorMode: boolean
    private timestamp: number
    private detected: {
        projectName: string
        rootPath: string
        prismaSchemaPath: string | null
        packageManager: 'npm' | 'yarn' | 'pnpm'
        tmpDirPath: string
    }

    private userChoices: {
        projectDirectory: string
        useExistingSchema: boolean
        generateSchema: boolean
        prismaSchemaPath: string | null
        createLocalDevServer: boolean
        useCdkBoilerplate: boolean
    }

    private installConfig: {
        dependencies: { package: string; dev: boolean }[]
        clones: { from: string; to: string; deleteSource?: boolean }[]
        scripts: { name: string; cmd: string }[]
        injects: { file: string; find: RegExp; replace: string }[]
        shells: { cmd: string; dir: string; when: 'before' | 'after' }[]
        recommendations: string[]
    }

    constructor() {
        // defaults
        this.gitBranch = ['preview', 'contributor'].includes(String(process.env?.INSTALL_MODE))
            ? 'maoosi/prisma-appsync#dev'
            : 'maoosi/prisma-appsync#latest'
        this.installPackage = ['preview', 'contributor'].includes(String(process.env?.INSTALL_MODE))
            ? 'prisma-appsync@preview'
            : 'prisma-appsync'
        this.cwd = process.cwd()
        this.timestamp = new Date().getTime()
        this.isContributorMode = String(process.env?.INSTALL_MODE) === 'contributor'
        this.detected = {
            projectName: '',
            rootPath: this.cwd,
            prismaSchemaPath: null,
            packageManager: 'npm',
            tmpDirPath: this.cwd,
        }
        this.userChoices = {
            projectDirectory: '',
            useExistingSchema: false,
            generateSchema: false,
            prismaSchemaPath: null,
            createLocalDevServer: false,
            useCdkBoilerplate: false,
        }
        this.installConfig = {
            dependencies: [],
            clones: [],
            scripts: [],
            injects: [],
            shells: [],
            recommendations: [],
        }
    }

    public async start(): Promise<void> {
        await this.printBranding()
        await this.askQuestions()
        await this.prepare()
        await this.install()

        if (!this.isContributorMode)
            await this.printQuickstart()
    }

    private async printBranding(): Promise<void> {
        let version = '> Undefined Version'

        if (!this.isContributorMode) {
            try {
                const detectedVersion = (await fs.readJson(path.join(__dirname, '../package.json')))?.version
                version = `v${detectedVersion}`
            }
            catch { }
        }
        else {
            version = '> Contributor Mode'
        }

        console.log()
        console.log('    ___      _                             _               __                  ')
        console.log('   / _ \\_ __(◭)___ _ __ ___   __ _        /_\\  _ __  _ __ / _\\_   _ _ __   ___ ')
        console.log('  / /◭)/ \'__| / __| \'_ ` _ \\ / _` |_____ //◭\\\\| \'_ \\| \'_ \\\\ \\| | | | \'_ \\ / __|')
        console.log(' / ___/| |  | \\__ \\ | | | | | (◭| |_____/  _  \\ |◭) | |◭) |\\ \\ |_| | | | | (__ ')
        console.log(' \\/    |_|  |_|___/_| |_| |_|\\__,_|     \\_/ \\_/ .__/| .__/\\__/\\__, |_| |_|\\___|')
        console.log('                                              |_|   |_|       |___/            ')
        console.log(`${bold('  ◭ Prisma-AppSync') + dim(' Installer')} ${cyan(version)}`)
        console.log()
    }

    private async printQuickstart(): Promise<void> {
        const devCmd = this.detected.packageManager === 'pnpm'
            ? 'pnpm run dev'
            : this.detected.packageManager === 'yarn'
                ? 'yarn run dev'
                : 'npm run dev'

        console.log()
        console.log(bold('  ◭ Prisma-AppSync Install Done!'))
        console.log()
        console.log(`  1. Run '${devCmd}'`)
        console.log('  2. Enjoy!')
        console.log()
    }

    private async askQuestions(): Promise<void> {
        // project dir
        if (!this.isContributorMode) {
            this.userChoices.projectDirectory = (
                await prompts({
                    type: 'text',
                    name: 'projectDirectory',
                    message: 'Project directory (default: current dir)',
                    initial: this.userChoices.projectDirectory,
                })
            ).projectDirectory.trim()
        }

        this.detected.projectName = String(path.join(this.cwd, this.userChoices.projectDirectory).split(/\/|\\/).pop())
        this.detected.rootPath = path.join(this.cwd, this.userChoices.projectDirectory)
        this.detected.packageManager = await detectPackageManager({ cwd: this.cwd })
        this.detected.prismaSchemaPath = this.findFilesInDir(this.detected.rootPath, /(\w+)\.prisma/)?.[0] || null
        this.detected.tmpDirPath = path.join(this.detected.rootPath, '.prisma-appsync')

        // prisma schema
        if (!this.isContributorMode) {
            if (this.detected.prismaSchemaPath) {
                this.userChoices.useExistingSchema = (
                    await prompts({
                        type: 'confirm',
                        name: 'useExistingSchema',
                        initial: true,
                        message: `Use existing \`${path.relative(this.cwd, this.detected.prismaSchemaPath)}\` file?`,
                    })
                ).useExistingSchema

                if (this.userChoices.useExistingSchema)
                    this.userChoices.prismaSchemaPath = this.detected.prismaSchemaPath
            }

            if (!this.userChoices.useExistingSchema) {
                this.userChoices.generateSchema = (
                    await prompts({
                        type: 'confirm',
                        name: 'generateSchema',
                        initial: true,
                        message: 'Generate new `prisma/schema.prisma` file?',
                    })
                ).generateSchema

                if (this.userChoices.generateSchema)
                    this.userChoices.prismaSchemaPath = path.join(this.detected.rootPath, 'prisma/schema.prisma')
            }
        }
        else {
            this.userChoices.useExistingSchema = false
            this.userChoices.generateSchema = true
            this.userChoices.prismaSchemaPath = path.join(this.detected.rootPath, 'prisma/schema.prisma')
        }

        // cdk boilerplate
        if (!this.isContributorMode) {
            this.userChoices.useCdkBoilerplate = (
                await prompts({
                    type: 'confirm',
                    name: 'useCdkBoilerplate',
                    initial: true,
                    message: 'Use provided CDK boilerplate to deploy on AWS?',
                })
            ).useCdkBoilerplate
        }
        else {
            this.userChoices.useCdkBoilerplate = true
        }

        // local dev server
        if (!this.isContributorMode) {
            this.userChoices.createLocalDevServer = (
                await prompts({
                    type: 'confirm',
                    name: 'createLocalDevServer',
                    initial: true,
                    message: 'Create local dev server?',
                })
            ).createLocalDevServer
        }
        else {
            this.userChoices.createLocalDevServer = true
        }
    }

    private async prepare(): Promise<void> {
        const emitter = degit(this.gitBranch, { cache: false, force: true, verbose: true })
        await emitter.clone(this.detected.tmpDirPath)

        // core deps
        if (!this.isContributorMode) {
            this.installConfig.dependencies = [
                ...this.installConfig.dependencies,
                ...[
                    { package: 'prisma', dev: true },
                    { package: '@prisma/client', dev: true },
                    { package: this.installPackage, dev: true },
                ],
            ]
        }
        else {
            this.installConfig.dependencies = [
                ...this.installConfig.dependencies,
                ...[
                    { package: 'prisma', dev: true },
                    { package: '@prisma/client', dev: true },
                ],
            ]
        }

        // handler
        if (!this.isContributorMode) {
            this.installConfig.clones.push({
                from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/handler.ts'),
                to: path.join(this.detected.rootPath, 'handler.ts'),
            })
        }
        else {
            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/handler.ts'),
                to: path.join(this.detected.rootPath, 'handler.ts'),
            })
            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/tsconfig.json'),
                to: path.join(this.detected.rootPath, 'tsconfig.json'),
            })
        }

        // prisma schema
        if (!this.isContributorMode && this.userChoices.prismaSchemaPath) {
            if (this.userChoices.useExistingSchema) {
                const schemaContent = fs.readFileSync(this.userChoices.prismaSchemaPath, 'utf-8')

                if (!schemaContent.match(/generator\s+appsync\s+{/g)) {
                    this.installConfig.injects.push({
                        file: this.userChoices.prismaSchemaPath,
                        find: /((?: )*generator\s+client\s+{[^}]*})/g,
                        replace: '$1\n\ngenerator appsync {\n\tprovider = "prisma-appsync"\n}',
                    })
                }

                if (!schemaContent.match(/binaryTargets\s*=\s*\[(.)*\]/g)) {
                    this.installConfig.injects.push({
                        file: this.userChoices.prismaSchemaPath,
                        find: /( *)provider\s*=\s*"prisma-client-js"(?:\r|\n)/g,
                        replace: '$1provider = "prisma-client-js"\n$1binaryTargets = ["native", "rhel-openssl-1.0.x"]\n',
                    })
                }
                else {
                    this.installConfig.recommendations.push(
                        'Make sure the `binaryTargets` inside your `schema.prisma` file include both "native" and "rhel-openssl-1.0.x"',
                    )
                }
            }
            else if (this.userChoices.generateSchema) {
                this.installConfig.clones.push({
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/prisma/sqlite.prisma'),
                    to: this.userChoices.prismaSchemaPath,
                })
            }
        }
        else if (this.userChoices.prismaSchemaPath) {
            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/prisma/postgres.prisma'),
                to: this.userChoices.prismaSchemaPath,
            })
            this.installConfig.injects.push({
                file: this.userChoices.prismaSchemaPath,
                find: /((?: )*generator\s+appsync\s+{[^}]*})/g,
                replace: 'generator appsync {\n\tprovider = "../dist/generator.js"\n}',
            })
        }
        this.installConfig.scripts.push({
            name: 'generate',
            cmd: 'npx prisma generate',
        })

        // local dev server
        if (this.userChoices.createLocalDevServer && this.userChoices.prismaSchemaPath) {
            this.installConfig.dependencies = [
                ...this.installConfig.dependencies,
                ...[
                    { package: '@types/node', dev: true },
                    { package: 'js-yaml', dev: true },
                ],
            ]

            if (!this.isContributorMode) {
                this.installConfig.clones.push({
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/server/server.ts'),
                    to: path.join(this.detected.rootPath, 'server.ts'),
                })

                const databaseUrl = 'file:dev.sqlite'

                const gqlSchemaPath = path.relative(
                    path.join(this.detected.rootPath),
                    path.join(path.dirname(this.userChoices.prismaSchemaPath), 'generated/prisma-appsync/schema.gql'),
                )

                const yamlResolversPath = path.relative(
                    path.join(this.detected.rootPath),
                    path.join(path.dirname(this.userChoices.prismaSchemaPath), 'generated/prisma-appsync/resolvers.yaml'),
                )

                const devCmd = [
                    'npx prisma generate',
                    `DATABASE_URL='${databaseUrl}' npx prisma db push --accept-data-loss`,
                    `DATABASE_URL='${databaseUrl}' npx vite-node ./server.ts --watch -- --schema ${gqlSchemaPath} --resolvers ${yamlResolversPath} --watchers '[{"watch":["**/*.prisma","*.prisma"],"exec":"npx prisma generate && DATABASE_URL='${databaseUrl}' npx prisma db push --accept-data-loss && touch ./server.ts"}]'`,
                ]

                this.installConfig.scripts.push({
                    name: 'dev',
                    cmd: devCmd.join(' && '),
                })
            }
            else {
                this.installConfig.clones.push({
                    from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/server/server.ts'),
                    to: path.join(this.detected.rootPath, 'server.ts'),
                })

                this.installConfig.clones.push({
                    from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/server/docker-compose.yml'),
                    to: path.join(this.detected.rootPath, 'docker-compose.yml'),
                })

                const databaseUrl = 'postgresql://prisma:prisma@localhost:5433/dev'

                const gqlSchemaPath = path.relative(
                    path.join(this.detected.rootPath),
                    path.join(path.dirname(this.userChoices.prismaSchemaPath), 'generated/prisma-appsync/schema.gql'),
                )

                const yamlResolversPath = path.relative(
                    path.join(this.detected.rootPath),
                    path.join(path.dirname(this.userChoices.prismaSchemaPath), 'generated/prisma-appsync/resolvers.yaml'),
                )

                const devCmd = [
                    'docker-compose up -d',
                    'npx prisma generate',
                    `DATABASE_URL='${databaseUrl}' npx prisma db push --accept-data-loss`,
                    `DATABASE_URL='${databaseUrl}' npx vite-node ./server.ts --watch -- --schema ${gqlSchemaPath} --resolvers ${yamlResolversPath} --watchers '[{"watch":"../packages/(client|generator)/**","exec":"cd ../ && pnpm run build --ignoreServer && cd playground && npx prisma generate && touch ./server.ts"},{"watch":["**/*.prisma","*.prisma"],"exec":"npx prisma generate && DATABASE_URL='${databaseUrl}' npx prisma db push --accept-data-loss && touch ./server.ts"}]'`,
                ]

                this.installConfig.scripts.push({
                    name: 'dev',
                    cmd: devCmd.join(' && '),
                })

                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'server.ts'),
                    find: /prisma-appsync\/dist\/server/g,
                    replace: '../packages/server/src',
                })
            }
        }

        // package
        if (!this.fileExists(path.join(this.detected.rootPath, 'package.json'))) {
            this.installConfig.shells.push({
                cmd: `${this.detected.packageManager} init -y`,
                dir: this.detected.rootPath,
                when: 'before',
            })
        }

        // cdk deps
        if (this.userChoices.useCdkBoilerplate) {
            if (!this.isContributorMode) {
                this.installConfig.clones.push({
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/cdk'),
                    to: path.join(this.detected.rootPath, 'cdk'),
                })
                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                    find: /nodeModules\: \[(.+)\]/g,
                    replace: 'nodeModules: [$1, \'prisma-appsync\']',
                })
                this.installConfig.clones.push({
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/cdk.json'),
                    to: path.join(this.detected.rootPath, 'cdk.json'),
                })
            }
            else {
                this.installConfig.clones.push({
                    from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/cdk'),
                    to: path.join(this.detected.rootPath, 'cdk'),
                })
                this.installConfig.clones.push({
                    from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/cdk.json'),
                    to: path.join(this.detected.rootPath, 'cdk.json'),
                })
            }

            this.installConfig.shells.push({
                cmd: `${this.detected.packageManager} install`,
                dir: path.join(this.detected.rootPath, 'cdk'),
                when: 'before',
            })
            this.installConfig.injects.push({
                file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                find: /\{\{ projectName \}\}/g,
                replace: this.detected.projectName,
            })
            this.installConfig.injects.push({
                file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                find: /\{\{ relativeHandlerPath \}\}/g,
                replace: path.relative(this.detected.rootPath, path.join(this.detected.rootPath, 'handler.ts')),
            })
            this.installConfig.scripts.push({
                name: 'deploy',
                cmd: 'cdk synth && cdk bootstrap && cdk deploy',
            })

            if (this.userChoices.prismaSchemaPath) {
                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                    find: /\{\{ relativeGqlSchemaPath \}\}/g,
                    replace: path.relative(
                        this.detected.rootPath,
                        path.join(
                            path.dirname(this.userChoices.prismaSchemaPath),
                            'generated/prisma-appsync/schema.gql',
                        ),
                    ),
                })
                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                    find: /\{\{ relativePrismaSchemaPath \}\}/g,
                    replace: path.relative(this.detected.rootPath, this.userChoices.prismaSchemaPath),
                })
                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                    find: /\{\{ relativeYmlResolversPath \}\}/g,
                    replace: path.relative(
                        this.detected.rootPath,
                        path.join(
                            path.dirname(this.userChoices.prismaSchemaPath),
                            'generated/prisma-appsync/resolvers.yaml',
                        ),
                    ),
                })
            }
        }

        // prisma generate
        if (this.userChoices.prismaSchemaPath) {
            this.installConfig.shells.push({
                cmd: 'npx prisma generate',
                dir: this.detected.rootPath,
                when: 'after',
            })
        }
    }

    private async install(): Promise<void> {
        const add = this.detected.packageManager === 'npm' ? 'install' : 'add'
        const saveDev = this.detected.packageManager === 'npm' ? '--save-dev' : '-D'

        // clones
        for (let j = 0; j < this.installConfig.clones.length; j++) {
            const clone = this.installConfig.clones[j]

            if (fs.existsSync(clone.to)) {
                const parts = clone.to.split('/')
                this.rename(
                    clone.to,
                    [
                        ...parts.splice(0, parts.length > 1 ? parts.length - 1 : 0),
                        ...[`previous_${this.timestamp}_${parts[parts.length - 1]}`],
                    ].join('/'),
                )
            }

            this.copy(clone.from, clone.to)

            if (typeof clone.deleteSource === 'boolean' && clone.deleteSource === true)
                this.remove(clone.from)
        }

        // injects
        for (let k = 0; k < this.installConfig.injects.length; k++) {
            const inject = this.installConfig.injects[k]
            this.replaceInFile(inject.file, inject.find, inject.replace)
        }

        // shells: before
        const shellsBefore = this.installConfig.shells.filter(s => s.when === 'before')
        for (let l = 0; l < shellsBefore.length; l++) {
            const shell = shellsBefore[l]
            const [baseCmd, ...execs] = shell.cmd.split(' ')

            await execa(baseCmd, execs, {
                stdio: 'inherit',
                cwd: shell.dir,
            })
        }

        // dependencies
        const devDeps = this.installConfig.dependencies.filter(d => d.dev === true).map(d => d.package)
        const deps = this.installConfig.dependencies.filter(d => d.dev !== true).map(d => d.package)

        if (devDeps.length > 0) {
            await execa(this.detected.packageManager, [add, ...devDeps, saveDev], {
                stdio: 'inherit',
                cwd: this.detected.rootPath,
            })
        }
        if (deps.length > 0) {
            await execa(this.detected.packageManager, [add, ...deps], {
                stdio: 'inherit',
                cwd: this.detected.rootPath,
            })
        }

        // scripts
        const pkg = this.readJson(path.join(this.detected.rootPath, 'package.json'))
        if (typeof pkg?.scripts === 'undefined')
            pkg.scripts = {}

        for (let m = 0; m < this.installConfig.scripts.length; m++) {
            const script = this.installConfig.scripts[m]

            if (typeof pkg?.scripts?.[script.name] !== 'undefined')
                pkg.scripts[`previous:${this.timestamp}:${script.name}`] = pkg.scripts[script.name]

            pkg.scripts[script.name] = script.cmd
        }

        this.writeJson(path.join(this.detected.rootPath, 'package.json'), pkg)

        // shells: after
        const shellsAfter = this.installConfig.shells.filter(s => s.when === 'after')
        for (let l = 0; l < shellsAfter.length; l++) {
            const shell = shellsAfter[l]
            const [baseCmd, ...execs] = shell.cmd.split(' ')

            await execa(baseCmd, execs, {
                stdio: 'inherit',
                cwd: shell.dir,
            })
        }

        // recos
        for (let n = 0; n < this.installConfig.recommendations.length; n++) {
            const reco = this.installConfig.recommendations[n]
            console.log(bold(cyan('  Note: ')) + reco + dim(' ...'))
        }

        // delete tmp dir
        this.removeDir(this.detected.tmpDirPath)
    }

    private writeJson(path: string, json: any): any {
        return fs.outputJsonSync(path, json, { spaces: 2 })
    }

    private readJson(path: string): any {
        return fs.readJsonSync(path, { throws: false })
    }

    private rename(before: string, after: string): void {
        fs.renameSync(before, after)
    }

    private copy(src: string, dest: string): void {
        const stat = fs.statSync(src)
        if (stat.isDirectory()) {
            this.copyDir(src, dest)
        }
        else {
            const parentDir = path.dirname(dest)
            fs.ensureDirSync(parentDir)
            fs.copyFileSync(src, dest)
        }
    }

    private copyDir(srcDir: string, destDir: string): void {
        fs.ensureDirSync(destDir)
        for (const file of fs.readdirSync(srcDir)) {
            if (!file.match(/(.+\.lock|node_modules)/)) {
                const srcFile = path.resolve(srcDir, file)
                const destFile = path.resolve(destDir, file)
                this.copy(srcFile, destFile)
            }
        }
    }

    private emptyDir(dir: string) {
        if (!fs.existsSync(dir))
            return

        for (const file of fs.readdirSync(dir)) {
            const abs = path.resolve(dir, file)
            // baseline is Node 12 so can't use rmSync :(
            if (fs.lstatSync(abs).isDirectory()) {
                this.emptyDir(abs)
                fs.rmdirSync(abs)
            }
            else {
                fs.unlinkSync(abs)
            }
        }
    }

    private remove(src: string) {
        const stat = fs.lstatSync(src)
        if (stat.isDirectory())
            this.removeDir(src)

        else
            fs.rmSync(src)
    }

    private removeDir(dir: string) {
        this.emptyDir(dir)
        fs.rmdirSync(dir)
    }

    private fileExists(file: string): boolean {
        return Boolean(fs.existsSync(file))
    }

    private replaceInFile(file: string, findRegex: RegExp, replace: string): void {
        const content = fs.readFileSync(file, 'utf-8')
        fs.writeFileSync(file, content.replace(findRegex, replace), 'utf-8')
    }

    private findFilesInDir(dir: string, findRegex: RegExp): string[] {
        let results: string[] = []
        const files = fs.readdirSync(dir)

        for (let i = 0; i < files.length; i++) {
            const filename = path.join(dir, files[i])
            const stat = fs.lstatSync(filename)

            if (stat.isDirectory() && !filename.includes('node_modules'))
                results = [...results, ...this.findFilesInDir(filename, findRegex)]

            else if (filename.match(findRegex))
                results.push(filename)
        }

        return results
    }
}

// eslint-disable-next-line no-new
new Installer()
