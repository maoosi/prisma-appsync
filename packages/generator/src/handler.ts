/* eslint-disable no-console */
// Dependencies
import { generatorHandler } from '@prisma/generator-helper'
import { PrismaAppSyncCompiler } from './compiler'

// Read Prisma AppSync version
// eslint-disable-next-line @typescript-eslint/no-var-requires
const generatorVersion = require('../../../package.json').version

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
        if (options?.generator?.output) {
            try {
                // Default client generator
                const clientGenerator = options?.otherGenerators?.find(g => g?.provider?.value === 'prisma-client-js')

                // Is debug mode enabled?
                const debug: boolean = typeof options?.generator?.config?.debug !== undefined
                    ? Boolean(options.generator.config.debug)
                    : false

                // Read output dir (ensures previous version of prisma are still supported)
                const outputDir: string = options?.generator?.output?.value || String()

                // Read preview features
                const previewFeatures: string[] = clientGenerator?.previewFeatures || []

                if (debug) {
                    console.log('[Prisma-AppSync] Generator config: ', {
                        ...options.generator.config,
                        output: outputDir,
                        previewFeatures,
                    })
                }

                // Init compiler with user options
                const compiler = new PrismaAppSyncCompiler(options.dmmf, {
                    schemaPath: options.schemaPath,
                    outputDir,
                    defaultDirective: options?.generator?.config?.defaultDirective || String(),
                    previewFeatures,
                    debug,
                })

                console.log('[Prisma-AppSync] Generating client.')

                // Generate client
                await compiler.makeClient()
                console.log('[Prisma-AppSync] Generating schema.')

                // Generate schema
                await compiler.makeSchema(options.generator.config.extendSchema)
                console.log('[Prisma-AppSync] Generating resolvers.')

                // Generate resolvers
                await compiler.makeResolvers(options.generator.config.extendResolvers)
                console.log('[Prisma-AppSync] Generating models mapping.')
            }
            catch (e) {
                console.error('Error: unable to compile files for Prisma AppSync Generator')
                throw e
            }
        }
        else {
            throw new Error('No output was specified for Prisma AppSync Generator')
        }
    },
})
