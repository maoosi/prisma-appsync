// Dependencies
import { PrismaAppSyncCompiler } from './compiler'
import { generatorHandler } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/sdk'

// Read Prisma AppSync version
const generatorVersion = require('../../package.json').version

// Prisma AppSync Generator Handler
generatorHandler({
    onManifest() {
        return {
            defaultOutput: 'generated/prisma-appsync',
            prettyName: 'Prisma-AppSync',
            requiresEngines: ['queryEngine'],
            version: generatorVersion,
        }
    },
    async onGenerate(options: any) {
        if (options.generator.output) {
            try {
                // Is debug mode enabled?
                const debug: boolean = typeof options.generator.debug === 'boolean'
                    ? options.generator.debug
                    : false

                if (debug) {
                    console.log(`[Prisma-AppSync] Generator config: `, options.generator.config)
                }

                // Read output dir (ensures previous version of prisma are still supported)
                const outputDir =
                    typeof options.generator.output === 'string'
                        ? (options.generator.output! as string)
                        : parseEnvValue(options.generator.output!)

                // Init compiler with user options
                const compiler = new PrismaAppSyncCompiler(options.dmmf, {
                    schemaPath: options.schemaPath,
                    outputDir,
                    defaultDirective: options?.generator?.config?.defaultDirective || String(),
                    debug,
                })

                if (debug) {
                    console.log(`[Prisma-AppSync] Parsed schema config: `, JSON.stringify(compiler.getConfig(), null, 2))
                }

                console.log(`[Prisma-AppSync] Generating client.`)

                // Generate client
                await compiler.makeClient()
                console.log(`[Prisma-AppSync] Generating schema.`)

                // Generate schema
                await compiler.makeSchema(options.generator.config.extendSchema)
                console.log(`[Prisma-AppSync] Generating resolvers.`)

                // Generate resolvers
                await compiler.makeResolvers(options.generator.config.extendResolvers)
                console.log(`[Prisma-AppSync] Generating models mapping.`)

                // Generate docs
                // await compiler.makeDocs()
            } catch (e) {
                console.error('Error: unable to compile files for Prisma AppSync Generator')
                throw e
            }
        } else {
            throw new Error('No output was specified for Prisma AppSync Generator')
        }
    },
})
