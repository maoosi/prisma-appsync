import * as cdk from '@aws-cdk/core'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import { Runtime } from '@aws-cdk/aws-lambda'
import {
    Role,
    ServicePrincipal,
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement
} from '@aws-cdk/aws-iam'
import {
    GraphqlApi,
    CfnApiKey,
    Schema,
    AuthorizationType,
    LambdaDataSource,
    NoneDataSource,
    Resolver,
    MappingTemplate
} from '@aws-cdk/aws-appsync'

require('dotenv').config()

export class AppSyncCdkStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // create new API
        const graphqlApi = new GraphqlApi(this, `${process.env.SERVICES_PREFIX}_Api`, {
            name: `${process.env.SERVICES_PREFIX}_Api`,
            schema: Schema.fromAsset( path.join(__dirname, process.env.APPSYNC_SCHEMA_PATH || ``) ),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.API_KEY
                }
            },
        })
        new cdk.CfnOutput(this, `${process.env.SERVICES_PREFIX}ApiEndpoint`, {
            value: graphqlApi.graphqlUrl,
            exportName: `${process.env.SERVICES_PREFIX}ApiEndpoint`
        })

        // create API key
        const today = new Date()
        const apiKey = new CfnApiKey(this, `${process.env.SERVICES_PREFIX}ApiKey`, {
            apiId: graphqlApi.apiId,
            description: `${process.env.SERVICES_PREFIX}_api-key`,
            expires: Math.floor( today.setDate(today.getDate() + 365) / 1000.0 )
        })
        new cdk.CfnOutput(this, `${process.env.SERVICES_PREFIX}CfnApiKey`, {
            value: apiKey.attrApiKey,
            exportName: `${process.env.SERVICES_PREFIX}ApiKey`
        })

        // lambda function policy statements
        const policyStatements = [
            new PolicyStatement({
                actions: [
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:CreateNetworkInterface",
                    "ec2:DeleteNetworkInterface",
                    "ec2:DescribeInstances",
                    "ec2:AttachNetworkInterface"
                ],
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
            runtime: Runtime.NODEJS_12_X,
            timeout: cdk.Duration.seconds(10),
            handler: 'main',
            entry: path.join(__dirname, process.env.HANDLER_FUNCTION_PATH || ``),
            memorySize: 512,
            depsLockFilePath: path.join(__dirname, '../yarn.lock'),
            bundling: {
                minify: true,
                commandHooks: {
                    beforeBundling(inputDir: string, outputDir: string): string[] {
                        const schemaPath =  path.join(
                            inputDir, process.env.PRISMA_SCHEMA_ROOT_PATH || 'schema.prisma'
                        )
                        return [`cp ${schemaPath} ${outputDir}`]
                    },
                    beforeInstall() {
                        return []
                    },
                    afterBundling() {
                        return [`npx prisma generate`]
                    }
                },
                nodeModules: ['prisma', '@prisma/client', 'prisma-appsync'],
            },
            environment: {
                CONNECTION_URL: process.env.PRISMA_CONNECTION_URL || ``
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
        const resolvers = yaml.safeLoad(
            fs.readFileSync(
                path.join(__dirname, process.env.APPSYNC_RESOLVERS_PATH || ``),
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
new AppSyncCdkStack(app, process.env.SERVICES_PREFIX || 'AppSyncGraphQL')
app.synth()
