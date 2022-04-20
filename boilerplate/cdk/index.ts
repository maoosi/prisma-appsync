import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import {
    Role,
    ServicePrincipal,
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement
} from 'aws-cdk-lib/aws-iam'
import {
    GraphqlApi,
    Schema,
    AuthorizationType,
    LambdaDataSource,
    NoneDataSource,
    Resolver,
    MappingTemplate
} from '@aws-cdk/aws-appsync-alpha'

require('dotenv').config()

export class AppSyncCdkStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // create new API
        const graphqlApi = new GraphqlApi(this, `${process.env.SERVICES_PREFIX}_Api`, {
            name: `${process.env.SERVICES_PREFIX}_Api`,
            schema: Schema.fromAsset(
                path.join(
                    __dirname,
                    String(process.env.ROOT_DIR_PATH),
                    String(process.env.PRISMA_APPSYNC_OUTPUT_PATH),
                    'schema.gql'
                )
            ),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.API_KEY,
                    apiKeyConfig: {
                        description: `${process.env.SERVICES_PREFIX}_api-key`,
                        expires: cdk.Expiration.after(cdk.Duration.days(365)),
                    },
                }
            },
        })
        new cdk.CfnOutput(this, `${process.env.SERVICES_PREFIX}ApiEndpoint`, {
            value: graphqlApi.graphqlUrl,
            exportName: `${process.env.SERVICES_PREFIX}ApiEndpoint`
        })
        new cdk.CfnOutput(this, `${process.env.SERVICES_PREFIX}ApiKey`, {
            value: graphqlApi.apiKey || '',
            exportName: `${process.env.SERVICES_PREFIX}ApiKey`
        })

        // lambda function policy statements
        const policyStatements = [
            new PolicyStatement({
                actions: ["rds-data:connect"],
                resources: ["*"]
            })
        ]

        // create function execution role
        const lambdaExecutionRole = new Role(
            this, `${process.env.SERVICES_PREFIX}_FuncExecutionRole`, {
                roleName: `${process.env.SERVICES_PREFIX}_FuncExecutionRole`,
                assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [
                    ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
                ],
                inlinePolicies: {
                    customApiFunctionPolicy: new PolicyDocument({
                        statements: policyStatements
                    })
                }
            }
        )

        // create lambda function datasource
        const lambdaFunction = new NodejsFunction(this, `${process.env.SERVICES_PREFIX}_Function`, {
            functionName: `${process.env.SERVICES_PREFIX}_Function`,
            role: lambdaExecutionRole,
            runtime: Runtime.NODEJS_14_X,
            timeout: cdk.Duration.seconds(10),
            handler: 'main',
            entry: path.join(
                __dirname,
                String(process.env.ROOT_DIR_PATH),
                String(process.env.HANDLER_FUNCTION_PATH)
            ),
            memorySize: 1536,
            depsLockFilePath: path.join(__dirname, '../yarn.lock'),
            bundling: {
                minify: true,
                commandHooks: {
                    beforeBundling(inputDir: string, outputDir: string): string[] {
                        const prismaSchema = path.join(
                            inputDir,
                            String(process.env.PRISMA_SCHEMA_PATH)
                        )

                        <% if (testingMode) { %>
                        const customSchema = path.join(
                            path.dirname(prismaSchema),
                            'custom-schema.gql'
                        )
                        const customResolvers = path.join(
                            path.dirname(prismaSchema),
                            'custom-resolvers.yaml'
                        )

                        return [
                            `cp ${prismaSchema} ${outputDir}`,
                            `cp ${customSchema} ${outputDir}`,
                            `cp ${customResolvers} ${outputDir}`,
                        ]<% } else { %>return [
                            `cp ${prismaSchema} ${outputDir}`,
                        ]<% } %>
                    },
                    beforeInstall() {
                        return []
                    },
                    afterBundling(<% if (testingMode) { %>inputDir: string, outputDir: string<% } %>): string[] {
                        return [
                            <% if (testingMode) { %>`cp -R ${path.join(inputDir, 'node_modules/.tmp/prisma-appsync/')} ${path.join(outputDir, 'node_modules/')}`,
                            <% } %>'npx prisma generate',
                            'rm -rf node_modules/@prisma/engines',
                            'rm -rf node_modules/@prisma/client/node_modules',
                            'rm -rf node_modules/.bin',
                            'rm -rf node_modules/prisma',
                            'rm -rf node_modules/prisma-appsync',
                            'rm -rf generated'
                        ]
                    }
                },
                <% if (testingMode) { %>nodeModules: ['prisma', '@prisma/client'],<% } else { %>nodeModules: ['prisma', '@prisma/client', 'prisma-appsync'],<% } %>
                forceDockerBundling: true
            },
            environment: {
                CONNECTION_URL: String(process.env.PRISMA_CONNECTION_URL)
            }
        })

        // create IAM role
        const apiRole = new Role(this, `${process.env.SERVICES_PREFIX}_Role`, {
            roleName: `${process.env.SERVICES_PREFIX}_Role`,
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
            inlinePolicies: {
                allowEc2DescribeNetworkInterfaces: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: [
                                "lambda:InvokeAsync",
                                "lambda:InvokeFunction"
                            ],
                            resources: [
                                lambdaFunction.functionArn
                            ]
                        })
                    ]
                })
            }
        })

        // create datasource of type "lambda"
        const dataSource_lambda = new LambdaDataSource(
            this,
            `${process.env.SERVICES_PREFIX}LambdaDatasource`, {
                api: graphqlApi,
                name: `${process.env.SERVICES_PREFIX}LambdaDataSource`,
                lambdaFunction: lambdaFunction,
                serviceRole: apiRole
            }
        )

        // create datasource of type "none"
        const dataSource_none = new NoneDataSource(this,
            `${process.env.SERVICES_PREFIX}NoneDatasource`, {
                api: graphqlApi,
                name: `${process.env.SERVICES_PREFIX}NoneDataSource`
            }
        )

        // read resolvers from yaml
        const resolvers = yaml.load(
            fs.readFileSync(
                path.join(
                    __dirname,
                    String(process.env.ROOT_DIR_PATH),
                    String(process.env.PRISMA_APPSYNC_OUTPUT_PATH),
                    'resolvers.yaml'
                ),
                'utf8'
            )
        )

        // create resolvers
        if (Array.isArray(resolvers)) {
            resolvers.forEach((resolver: any) => {
                const resolvername = `${resolver.fieldName}${resolver.typeName}_resolver`

                if (['lambda', 'prisma-appsync'].includes(resolver.dataSource)) {
                    new Resolver(
                        this, resolvername,
                        {
                            api: graphqlApi,
                            typeName: resolver.typeName,
                            fieldName: resolver.fieldName,
                            dataSource: dataSource_lambda,
                        }
                    )
                } else if (resolver.dataSource === 'none') {
                    new Resolver(
                        this, resolvername,
                        {
                            api: graphqlApi,
                            typeName: resolver.typeName,
                            fieldName: resolver.fieldName,
                            dataSource: dataSource_none,
                            requestMappingTemplate: MappingTemplate.fromString(resolver.requestMappingTemplate),
                            responseMappingTemplate: MappingTemplate.fromString(resolver.responseMappingTemplate)
                        }
                    )
                }
            })
        }
    }

}

const app = new cdk.App()
new AppSyncCdkStack(app, String(process.env.SERVICES_PREFIX))
app.synth()
