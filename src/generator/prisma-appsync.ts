// Dependencies
import { PrismaAppSyncCompiler } from './compiler'
import { generatorHandler } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/sdk'

// Prisma AppSync Generator Handler
generatorHandler({
    onManifest() {
        return {
            defaultOutput: 'generated/prisma-appsync',
            prettyName: 'Prisma-AppSync',
            requiresEngines: ['queryEngine'],
        }
    },
    async onGenerate(options:any) {
        if (options.generator.output) {
            try {

                // Parse directive aliases
                const aliasPrefix:string = 'directiveAlias_'
                const directiveAliases:any = {}

                // Is debug mode enabled?
                const debug:boolean = 
                    typeof options.generator.config.debug !== 'undefined'
                    && String(options.generator.config.debug) === 'true'

                if (debug) {
                    console.log(`[Prisma-AppSync] Generator config: `, options.generator.config)
                }

                Object.keys(options.generator.config)
                    .filter((cfg:string) => cfg.startsWith(aliasPrefix))
                    .forEach((cfg:string) => {
                        const directive:string = options.generator.config[cfg]
                        const splitIndex:number = cfg.indexOf(aliasPrefix) + aliasPrefix.length
                        const aliasKey:string = cfg.substr(splitIndex)
                        directiveAliases[aliasKey] = directive
                    })

                // Read output dir (ensures previous version of prisma are still supported)
                const outputDir =
                    typeof options.generator.output === 'string'
                      ? (options.generator.output! as string)
                      : parseEnvValue(options.generator.output!)

                // Init compiler with user options
                const compiler = new PrismaAppSyncCompiler(options.dmmf, {
                    schemaPath: options.schemaPath,
                    outputDir: outputDir,
                    directiveAliases: directiveAliases,
                    debug: debug
                })

                if (debug) {
                    console.log(`[Prisma-AppSync] Generating client.`)
                }

                // Generate client
                await compiler.makeClient()

                if (debug) {
                    console.log(`[Prisma-AppSync] Generating schema.`)
                }

                // Generate schema
                await compiler.makeSchema(options.generator.config.customSchema)

                if (debug) {
                    console.log(`[Prisma-AppSync] Generating resolvers.`)
                }

                // Generate resolvers
                await compiler.makeResolvers(options.generator.config.customResolvers)

                if (debug) {
                    console.log(`[Prisma-AppSync] Generating docs.`)
                }

                // Generate docs
                await compiler.makeDocs()

            } catch (e) {
                console.error('Error: unable to compile files for Prisma AppSync Generator')
                throw e
            }
        } else {
            throw new Error('No output was specified for Prisma AppSync Generator')
        }
    }
})
