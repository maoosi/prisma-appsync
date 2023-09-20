/* eslint-disable no-console */
// Dependencies
import { generatorHandler } from '@prisma/generator-helper'
import PrismaAppSyncGenerator from './generator'

// Read Prisma AppSync version
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
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
                const debug: boolean = typeof options?.generator?.config?.debug !== 'undefined'
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

                // Initiate generator
                const generator = new PrismaAppSyncGenerator({
                    outputDir, // output directory
                    prismaDmmf: options.dmmf, // prisma dmmf object
                    prismaSchemaPath: options.schemaPath, // prisma schema path
                    userGraphQLPath: options.generator?.config?.extendSchema, // user gql path
                    userResolversPath: options.generator?.config?.extendResolvers, // user resolvers path
                    defaultDirective: options?.generator?.config?.defaultDirective, // default directive(s)
                })

                // Make appsync schema
                console.log('[Prisma-AppSync] Generating AppSync Schema.')
                await generator.makeAppSyncSchema()

                // Make appsync resolvers
                console.log('[Prisma-AppSync] Generating AppSync Resolvers.')
                await generator.makeAppSyncResolvers()

                // Make client config
                console.log('[Prisma-AppSync] Generating Client Runtime Config.')
                await generator.makeClientRuntimeConfig()
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
