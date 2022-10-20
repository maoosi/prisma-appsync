/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import fs from 'fs-extra'
import prompts from 'prompts'
import degit from 'degit'
import execa from 'execa'
import { detect as detectPackageManager } from 'detect-package-manager'
import { bold, cyan, dim } from 'kolorist'

export class Installer {
    private gitBranch: string
    private installPackage: string
    private version: string
    private localServerDir: string
    private localServerPort: number
    private cwd: string
    private isLocalDevMode: boolean
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
        this.gitBranch = String(process.env?.MODE) === 'preview'
            ? 'maoosi/prisma-appsync#dev'
            : 'maoosi/prisma-appsync#main'
        this.installPackage = String(process.env?.MODE) === 'preview'
            ? 'prisma-appsync@preview'
            : 'prisma-appsync'
        this.version = String(require('../package.json')?.version)
        this.localServerDir = '.server'
        this.localServerPort = 4000
        this.cwd = process.cwd()
        this.timestamp = new Date().getTime()
        this.isLocalDevMode = String(process.env?.PRISMA_APPSYNC_CREATEAPP_MODE) === 'dev'
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
    }

    private printBranding(): void {
        console.log()
        console.log('    ___      _                             _               __                  ')
        console.log('   / _ \\_ __(◭)___ _ __ ___   __ _        /_\\  _ __  _ __ / _\\_   _ _ __   ___ ')
        console.log('  / /◭)/ \'__| / __| \'_ ` _ \\ / _` |_____ //◭\\\\| \'_ \\| \'_ \\\\ \\| | | | \'_ \\ / __|')
        console.log(' / ___/| |  | \\__ \\ | | | | | (◭| |_____/  _  \\ |◭) | |◭) |\\ \\ |_| | | | | (__ ')
        console.log(' \\/    |_|  |_|___/_| |_| |_|\\__,_|     \\_/ \\_/ .__/| .__/\\__/\\__, |_| |_|\\___|')
        console.log('                                              |_|   |_|       |___/            ')
        console.log(`${bold('  ◭ Prisma-AppSync') + dim(' Installer')} ${cyan(`v${this.version}`)}`)
        console.log()
    }

    private async askQuestions(): Promise<void> {
        // project dir
        if (!this.isLocalDevMode) {
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
        this.detected.prismaSchemaPath = this.findFilesInDir(this.detected.rootPath, /.+\.prisma/)?.[0] || null
        this.detected.tmpDirPath = path.join(this.detected.rootPath, '.prisma-appsync')

        // prisma schema
        if (!this.isLocalDevMode) {
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
                        message: 'Generate new `prisma/prisma.schema` file?',
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
        if (!this.isLocalDevMode) {
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
        if (!this.isLocalDevMode) {
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
        if (!this.isLocalDevMode) {
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
        if (!this.isLocalDevMode) {
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
        }

        // prisma schema
        if (!this.isLocalDevMode && this.userChoices.prismaSchemaPath) {
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
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/prisma/schema.prisma'),
                    to: this.userChoices.prismaSchemaPath,
                })
            }
        }
        else if (this.userChoices.prismaSchemaPath) {
            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/prisma/schema.prisma'),
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
                    { package: 'zx', dev: true },
                    { package: 'pm2', dev: true },
                ],
            ]

            this.installConfig.shells.push({
                cmd: 'npx pm2 install typescript',
                dir: this.detected.rootPath,
                when: 'after',
            })

            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/server'),
                to: path.join(this.detected.rootPath, this.localServerDir),
            })

            this.installConfig.scripts.push({
                name: 'serve',
                cmd: 'zx ./.server/server.mjs --experimental',
            })

            const serverTsPath = path.join(this.detected.rootPath, this.localServerDir, 'server.ts')
            const serverMjsPath = path.join(this.detected.rootPath, this.localServerDir, 'server.mjs')

            this.installConfig.injects.push({
                file: serverTsPath,
                find: /\{\{ relativeGqlSchemaPath \}\}/g,
                replace: path.relative(
                    path.join(this.detected.rootPath, this.localServerDir),
                    path.join(path.dirname(this.userChoices.prismaSchemaPath), 'generated/prisma-appsync/schema.gql'),
                ),
            })
            this.installConfig.injects.push({
                file: serverTsPath,
                find: /\{\{ relativePrismaSchemaPath \}\}/g,
                replace: path.relative(
                    path.join(this.detected.rootPath, this.localServerDir),
                    this.userChoices.prismaSchemaPath,
                ),
            })

            this.installConfig.injects.push({
                file: serverMjsPath,
                find: /\{\{ localServerPort \}\}/g,
                replace: String(this.localServerPort),
            })

            if (this.isLocalDevMode) {
                this.installConfig.injects.push({
                    file: serverTsPath,
                    find: /prisma-appsync\/dist\/appsync-server/g,
                    replace: '../../dist/appsync-server',
                })

                this.installConfig.injects.push({
                    file: serverTsPath,
                    find: /(watch:.*{)/g,
                    replace: [
                        '$1',
                        '\t\t[join(__dirname, \'../../packages/\')]: async ({ exec }) => {',
                        '\t\t\tawait exec(\'pnpm build\', { cwd: join(__dirname, \'../../\') })',
                        '\t\t\tawait exec(\'npx prisma generate\', { cwd: join(__dirname, \'../\') })',
                        '\t\t},',
                    ].join('\n'),
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
            if (!this.isLocalDevMode) {
                this.installConfig.clones.push({
                    from: path.join(this.detected.tmpDirPath, 'packages/boilerplate/cdk'),
                    to: path.join(this.detected.rootPath, 'cdk'),
                })
                this.installConfig.injects.push({
                    file: path.join(this.detected.rootPath, 'cdk/src/index.ts'),
                    find: /nodeModules\: \[(.+)\]/g,
                    replace: 'nodeModules: [$1, \'prisma-appsync\']',
                })
            }
            else {
                this.installConfig.clones.push({
                    from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/cdk'),
                    to: path.join(this.detected.rootPath, 'cdk'),
                })
            }
            this.installConfig.clones.push({
                from: path.join(this.detected.rootPath, '../', 'packages/boilerplate/cdk.json'),
                to: path.join(this.detected.rootPath, 'cdk.json'),
            })
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
                        ...[`legacy_${this.timestamp}_${parts[parts.length - 1]}`],
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
                pkg.scripts[`legacy:${this.timestamp}:${script.name}`] = pkg.scripts[script.name]

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

            if (stat.isDirectory())
                results = [...results, ...this.findFilesInDir(filename, findRegex)]

            else if (filename.match(findRegex))
                results.push(filename)
        }

        return results
    }
}

// eslint-disable-next-line no-new
new Installer()
