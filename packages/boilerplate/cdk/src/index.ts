import { App } from 'aws-cdk-lib'
import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha'
import { AppSyncStack } from './appsync'
import { join } from 'path'

require('dotenv').config()

const app = new App()

new AppSyncStack(app, String(process.env.SERVICES_PREFIX), {
    resourcesPrefix: `{{ projectName }}-api`,
    schema: join(__dirname, `{{ relativeGqlSchemaPath }}`),
    resolvers: join(__dirname, `{{ relativeYmlResolversPath }}`),
    function: {
        code: join(__dirname, '{{ relativeHandlerPath }}'),
        memorySize: 1536,
        warmUp: false, // warmUp=true will incur extra costs
        environment: {
            NODE_ENV: 'production',
            DATABASE_URL: process.env.DATABASE_URL,
        }
    },
    authorizationConfig: {
        defaultAuthorization: {
            authorizationType: AuthorizationType.API_KEY,
        }
    },
})

app.synth()