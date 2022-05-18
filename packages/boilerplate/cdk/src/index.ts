import { App } from 'aws-cdk-lib'
import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha'
import { kebabCase } from 'scule'
import { AppSyncStack } from './appsync'
import { join } from 'path'

const app = new App()

new AppSyncStack(app, kebabCase('{{ projectName }}'), {
    resourcesPrefix: '{{ projectName }}-api',
    schema: join(process.cwd(), '{{ relativeGqlSchemaPath }}'),
    resolvers: join(process.cwd(), '{{ relativeYmlResolversPath }}'),
    function: {
        code: join(process.cwd(), '{{ relativeHandlerPath }}'),
        memorySize: 1536,
        warmUp: false, // warmUp=true will incur extra costs
        environment: {
            NODE_ENV: 'production',
            DATABASE_URL: process.env.DATABASE_URL,
        },
        bundling: {
            minify: true,
            sourceMap: true,
            forceDockerBundling: true,
            commandHooks: {
                beforeBundling(inputDir: string, outputDir: string): string[] {
                    return [`cp ${inputDir}/{{ relativePrismaSchemaPath }} ${outputDir}`]
                },
                beforeInstall() {
                    return []
                },
                afterBundling() {
                    return [
                        `npx prisma generate`,
                        'rm -rf generated',

                        // yarn + npm
                        'rm -rf node_modules/@prisma/engines',
                        'rm -rf node_modules/@prisma/client/node_modules',
                        'rm -rf node_modules/.bin',
                        'rm -rf node_modules/prisma',
                        'rm -rf node_modules/prisma-appsync',
                    ]
                },
            },
            nodeModules: ['prisma', '@prisma/client'],
            environment: {
                NODE_ENV: 'production',
            },
        },
    },
    authorizationConfig: {
        defaultAuthorization: {
            authorizationType: AuthorizationType.API_KEY,
        },
    },
})

app.synth()
