import { App } from 'aws-cdk-lib'
import { AppSyncStack } from './appsync'

require('dotenv').config()

const app = new App()

new AppSyncStack(app, String(process.env.SERVICES_PREFIX), {
    resourcesPrefix: String(),
    ssmPrefix: String(),
    schema: String(),
    resolvers: String(),
    function: {
        code: String(),
        keepAlive: false,
    },
    additionalApiKeys: [],
})

app.synth()