const path = require('path')

module.exports = {
    description: 'Scaffolding out Prisma-AppSync boilerplate.',
    templateDir: 'boilerplate',
    prepare() {
        this.testingMode = typeof this.sao.opts.testingMode !== 'undefined' 
            && this.sao.opts.testingMode === true
    },
    prompts() {
        return !this.testingMode ? [
            {
                name: 'name',
                message: 'How do you want to name the new API?',
                default: 'PrismaAppSync'
            },
            {
                name: 'createSchema',
                message: 'Do you want to add a sample prisma.schema file?',
                type: 'confirm',
                default: false
            },
            {
                name: 'connectionUrl',
                message: 'Enter your database connection url',
                default: 'postgresql://janedoe:mypassword@localhost:5432/mydb'
            }
        ]: [
            {
                name: 'connectionUrl',
                message: 'Enter your TEST database connection url',
                default: 'postgresql://janedoe:mypassword@localhost:5432/mydb'
            }
        ]
    },
    actions() {
        if (this.testingMode) {
            this._answers.name = `PrismaAppSync${String(this.sao.opts.testingTimestamp)}`
            this._answers.createSchema = true
            this._answers.testingMode = true
        } else {
            this._answers.testingMode = false
        }

        return [
            {
                type: 'add',
                files: '**',
                filters: {
                    'cdk/node_modules/': false,
                    'cdk/yarn.lock': false,
                    'prisma/**': 'createSchema',
                }
            }
        ]
    },
    async completed() {
        const installDir = path.relative(process.cwd(), this.outDir)

        // install cdk dependencies
        await this.npmInstall({
            cwd: path.join(this.outDir, 'cdk'),
            npmClient: this.npmClient
        })

        // if createSchema, add depdencies
        if (this.answers.createSchema) {
            const hasPkg = await this.fs.pathExists(
                path.join(this.outDir, 'package.json')
            )

            if (!hasPkg) {
                const package = {
                    name: this.answers.name.toLowerCase(),
                    version: '1.0.0',
                    scripts: {
                        deploy: 'prisma generate && cd cdk && cdk deploy'
                    }
                }

                if (this.testingMode) {
                    package.scripts['deploy:prepare'] = 'rm -rf node_modules/.tmp/prisma-appsync/ && mkdir -p node_modules/.tmp/prisma-appsync/dist/ && cp -R node_modules/prisma-appsync/dist/ node_modules/.tmp/prisma-appsync/dist/'
                    package.scripts.deploy = 'yarn deploy:prepare && prisma generate && cd cdk && cdk deploy'
                }

                await this.fs.writeFile(
                    path.join(this.outDir, 'package.json'),
                    JSON.stringify(package)
                )
            }

            if (!this.testingMode) {
                await this.npmInstall({
                    cwd: this.outDir,
                    npmClient: this.npmClient,
                    packages: ['prisma', 'prisma-appsync'],
                    saveDev: true
                })
            } else {
                await this.npmInstall({
                    cwd: this.outDir,
                    npmClient: this.npmClient,
                    packages: ['prisma', 'link:../prisma-appsync'],
                    saveDev: true
                })
            }

            await this.npmInstall({
                cwd: this.outDir,
                npmClient: this.npmClient,
                packages: ['@prisma/client']
            })
        }

        this.showProjectTips()

        console.log("\n⚡ READY!\n")

        const c1 = installDir !== ''
            ? `cd ${installDir} && `
            : String()

        this.logger.info(
            'Generate Prisma client: ' +
            this.chalk.blue.underline.bold(`${c1}npx prisma generate`)
        )

        const c2 = installDir !== ''
            ? `code ${path.join(installDir, 'cdk', '.env')}`
            : `code cdk/.env`

        this.logger.info(
            'Edit CDK config: ' +
            this.chalk.blue.underline.bold(`${c2}`)
        )

        const c3 = installDir !== ''
            ? `cd ${installDir} && `
            : String()

        this.logger.info(
            'Deploy on AWS: ' +
            this.chalk.blue.underline.bold(`${c3}${this.npmClient} deploy`) + "\n"
        )

    }
}