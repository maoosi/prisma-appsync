module.exports = {
    description: 'Scaffolding out Prisma-AppSync boilerplate.',
    templateDir: 'boilerplate',
    prompts() {
        return [
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
        ]
    },
    actions() {
        return [
            {
                type: 'add',
                files: '**',
                filters: {
                    'cdk/node_modules/': false,
                    'cdk/yarn.lock': false,
                    'prisma/**': 'createSchema'
                }
            }
        ]
    },
    async completed() {

        // install cdk dependencies
        await this.npmInstall({
            cwd: `${this.outFolder}/cdk`,
            npmClient: this.npmClient
        })

        // if createSchema, add depdencies
        if (this.answers.createSchema) {
            const hasPkg = await this.fs.pathExists(
                `${this.outFolder}/package.json`
            )

            if (!hasPkg) {
                const package = {
                    name: this.answers.name.toLowerCase(),
                    version: '1.0.0'
                }

                await this.fs.writeFile(
                    `${this.outFolder}/package.json`,
                    JSON.stringify(package)
                )
            }

            await this.npmInstall({
                cwd: `${this.outFolder}`,
                npmClient: this.npmClient,
                packages: ['prisma', 'prisma-appsync'],
                saveDev: true
            })

            await this.npmInstall({
                cwd: `${this.outFolder}`,
                npmClient: this.npmClient,
                packages: ['@prisma/client']
            })
        }

        this.showProjectTips()

        console.log("\n⚡ READY!\n")

        const c1 = this.outFolder !== '.'
            ? `cd ${this.outFolder} && `
            : String()

        this.logger.info(
            'Generate Prisma client: ' +
            this.chalk.blue.underline.bold(`${c1}npx prisma generate`)
        )

        const c2 = this.outFolder !== '.'
            ? `code ${this.outFolder}/cdk/.env`
            : `code cdk/.env`

        this.logger.info(
            'Edit CDK config: ' +
            this.chalk.blue.underline.bold(`${c2}`)
        )

        const c3 = this.outFolder !== '.'
            ? `cd ${this.outFolder}/cdk && `
            : `cd cdk && `

        this.logger.info(
            'Deploy on AWS: ' +
            this.chalk.blue.underline.bold(`${c3}cdk deploy`) + "\n"
        )

    }
}