import { dirname, join } from 'node:path'
import { copy, outputFile, readFile } from 'fs-extra'
import type { DMMF } from '@prisma/generator-helper'
import SchemaBuilder from './schema'
import ResolversBuilder from './resolvers'
import ClientConfigBuilder from './client'

export default class PrismaAppSyncGenerator {
    private prismaDmmf: GeneratorOption['prismaDmmf']
    private outputDir: GeneratorOption['outputDir']
    private prismaSchemaPath: GeneratorOption['prismaSchemaPath']
    private userGraphQLPath?: GeneratorOption['userGraphQLPath']
    private userResolversPath?: GeneratorOption['userResolversPath']
    private defaultDirective?: GeneratorOption['defaultDirective']

    constructor(options: GeneratorOption) {
        this.outputDir = options.outputDir
        this.prismaDmmf = options.prismaDmmf
        this.prismaSchemaPath = options.prismaSchemaPath
        this.userGraphQLPath = options?.userGraphQLPath
        this.userResolversPath = options?.userResolversPath
        this.defaultDirective = options?.defaultDirective
    }

    public async makeAppSyncSchema() {
        let schema: string

        const builder = new SchemaBuilder()

        // create schema from prisma dmmf
        schema = await builder.createSchema(this.prismaDmmf, { defaultDirective: this.defaultDirective })

        // extendSchema option
        if (this.userGraphQLPath) {
            // read user schema
            const userSchema = await readFile(join(dirname(this.prismaSchemaPath), this.userGraphQLPath), {
                encoding: 'utf-8',
            })

            // merge with generated schema
            schema = await builder.mergeSchemas(schema, userSchema)
        }

        // output graphql schema
        await outputFile(join(this.outputDir, 'schema.gql'), schema, 'utf-8')
    }

    public async makeAppSyncResolvers() {
        let resolvers: string

        const builder = new ResolversBuilder()

        // create schema from prisma dmmf
        resolvers = await builder.createResolvers(this.prismaDmmf, { defaultDirective: this.defaultDirective })

        // extendResolvers option
        if (this.userResolversPath) {
            // read user resolvers
            const userResolvers = await readFile(join(dirname(this.prismaSchemaPath), this.userResolversPath), {
                encoding: 'utf8',
            })

            // merge with generated resolvers
            resolvers = await builder.mergeResolvers(resolvers, userResolvers)
        }

        // output yaml resolvers
        await outputFile(join(this.outputDir, 'resolvers.yaml'), resolvers, 'utf-8')
    }

    public async makeClientRuntimeConfig() {
        const builder = new ClientConfigBuilder()

        // create config from prisma dmmf
        const runtimeConfig = await builder.createRuntimeConfig(this.prismaDmmf, { defaultDirective: this.defaultDirective })

        // copy client to outputDir
        await copy(join(__dirname, './client'), join(this.outputDir, 'client'))

        // client files (js + ts defs)
        await this.replaceInFile(
            join(this.outputDir, 'client', 'index.js'),
            /((?: )*{}\;*\s*\/\/\!\s+inject:config)/g,
            JSON.stringify(runtimeConfig),
        )

        // inject in client ts defs
        await this.replaceInFile(
            join(this.outputDir, 'client', 'core.d.ts'),
            /((?: )*(\'|\")\/\/\!\s+inject:type:operations(\'|\"))/g,
            runtimeConfig.operations
                .sort()
                .map((o: string) => `"${o}"`)
                .join(' | '),
        )
    }

    private async replaceInFile(file: string, findRegex: RegExp, replace: string) {
        const content = await readFile(file, 'utf-8')
        const newContent = content.replace(findRegex, replace)
        await outputFile(file, newContent, 'utf-8')

        return newContent
    }
}

export type GeneratorOption = {
    outputDir: string
    prismaDmmf: DMMF.Document
    prismaSchemaPath: string
    userGraphQLPath?: string
    userResolversPath?: string
    defaultDirective?: string
}
