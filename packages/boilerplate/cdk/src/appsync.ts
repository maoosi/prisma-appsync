/* eslint-disable no-new */
import { readFileSync } from 'fs'
import type { Construct } from 'constructs'
import { camelCase, kebabCase, pascalCase } from 'scule'
import { load } from 'js-yaml'
import {
    Duration,
    RemovalPolicy,
    Stack,
    aws_appsync as appSync,
    aws_iam as iam,
    aws_lambda as lambda,
    aws_lambda_nodejs as lambdaNodejs,
    type StackProps
} from 'aws-cdk-lib'

export interface AppSyncStackProps {
    resourcesPrefix: string
    cognitoUserPoolId?: string
    schema: string
    resolvers: string
    function: {
        code: string
        memorySize: number
        useWarmUp: number
        policies?: iam.PolicyStatementProps[]
        bundling?: lambdaNodejs.BundlingOptions
        environment?: {}
    }
    additionalApiKeys?: string[]
    authorizationConfig: appSync.AuthorizationConfig
}

export class AppSyncStack extends Stack {
    private props: AppSyncStackProps
    private resourcesPrefix: string
    private resourcesPrefixCamel: string
    private graphqlApi: appSync.GraphqlApi
    private directResolverFn: lambda.Alias
    private apiRole: iam.Role
    private dataSources: {
        lambda?: appSync.LambdaDataSource
        none?: appSync.NoneDataSource
    }

    constructor(scope: Construct, id: string, tplProps: AppSyncStackProps, props?: StackProps) {
        super(scope, id, props)

        // stack naming convention
        this.props = tplProps
        this.resourcesPrefix = kebabCase(this.props.resourcesPrefix)
        this.resourcesPrefixCamel = camelCase(this.resourcesPrefix)

        this.createGraphQLApi()
        this.createLambdaResolver()
        this.createDataSources()
        this.createPrismaAppSyncResolvers()
    }

    createGraphQLApi() {
        // create appsync instance
        this.graphqlApi = new appSync.GraphqlApi(this, `${this.resourcesPrefixCamel}Api`, {
            name: this.resourcesPrefix,
            schema: appSync.SchemaFile.fromAsset(this.props.schema),
            authorizationConfig: this.props.authorizationConfig,
            logConfig: {
                fieldLogLevel: appSync.FieldLogLevel.ERROR,
            },
            xrayEnabled: true,
        })

        // create default API key
        new appSync.CfnApiKey(this, `${this.resourcesPrefixCamel}ApiKey`, {
            apiId: this.graphqlApi.apiId,
            description: `${this.resourcesPrefix}_api-key`,
            expires: Math.floor(new Date().setDate(new Date().getDate() + 365) / 1000.0),
        })

        // create additional API keys
        if (this.props.additionalApiKeys) {
            this.props.additionalApiKeys.forEach((apiKey: string) => {
                new appSync.CfnApiKey(this, `${this.resourcesPrefixCamel}ApiKey${pascalCase(apiKey)}`, {
                    apiId: this.graphqlApi.apiId,
                    description: `${this.resourcesPrefix}_api-key_${kebabCase(apiKey)}`,
                    expires: Math.floor(new Date().setDate(new Date().getDate() + 365) / 1000.0),
                })
            })
        }
    }

    createLambdaResolver() {
        // create function execution role
        const lambdaExecutionRole = new iam.Role(this, `${this.resourcesPrefixCamel}FnExecRole`, {
            roleName: `${this.resourcesPrefix}_fn-exec-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
            ...(this.props.function?.policies
                && this.props.function.policies.length > 0 && {
                inlinePolicies: {
                    customApiFunctionPolicy: new iam.PolicyDocument({
                        statements: this.props.function.policies.map((statement) => {
                            return new iam.PolicyStatement(statement)
                        }),
                    }),
                },
            }),
        })

        // create lambda function datasource
        const lambdaFunction = new lambdaNodejs.NodejsFunction(this, `${this.resourcesPrefixCamel}Fn`, {
            functionName: `${this.resourcesPrefix}_fn`,
            role: lambdaExecutionRole,
            environment: this.props.function.environment || {},
            runtime: lambda.Runtime.NODEJS_18_X,
            timeout: Duration.seconds(10),
            handler: 'main',
            entry: this.props.function.code,
            memorySize: this.props.function.memorySize,
            tracing: lambda.Tracing.ACTIVE,
            currentVersionOptions: {
                removalPolicy: RemovalPolicy.RETAIN,
                retryAttempts: 2,
            },
            ...(this.props.function.bundling && {
                bundling: this.props.function.bundling,
            }),
        })

        // create alias (from latest version)
        this.directResolverFn = new lambda.Alias(this, `${this.resourcesPrefixCamel}_FnAliasLive`, {
            aliasName: 'live',
            version: lambdaFunction.currentVersion,
            ...(this.props.function.useWarmUp > 0 && {
                provisionedConcurrentExecutions: this.props.function.useWarmUp,
            }),
        })

        // create IAM role
        this.apiRole = new iam.Role(this, `${this.resourcesPrefixCamel}ApiRole`, {
            roleName: `${this.resourcesPrefix}_api-role`,
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
            inlinePolicies: {
                allowEc2DescribeNetworkInterfaces: new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: ['lambda:InvokeAsync', 'lambda:InvokeFunction'],
                            resources: [this.directResolverFn.functionArn],
                        }),
                    ],
                }),
            },
        })
    }

    createPrismaAppSyncResolvers() {
        // read resolvers from yaml
        const resolvers = load(readFileSync(this.props.resolvers, 'utf8'))

        // create resolvers
        if (Array.isArray(resolvers)) {
            resolvers.forEach((resolver: any) => {
                const resolvername = `${resolver.fieldName}${resolver.typeName}_resolver`

                if (['lambda', 'prisma-appsync'].includes(resolver.dataSource) && this.dataSources.lambda) {
                    new appSync.Resolver(this, resolvername, {
                        api: this.graphqlApi,
                        typeName: resolver.typeName,
                        fieldName: resolver.fieldName,
                        dataSource: this.dataSources.lambda,
                    })
                }
                else if (resolver.dataSource === 'none' && this.dataSources.none) {
                    new appSync.Resolver(this, resolvername, {
                        api: this.graphqlApi,
                        typeName: resolver.typeName,
                        fieldName: resolver.fieldName,
                        dataSource: this.dataSources.none,
                        requestMappingTemplate: appSync.MappingTemplate.fromString(
                            resolver.requestMappingTemplate,
                        ),
                        responseMappingTemplate: appSync.MappingTemplate.fromString(
                            resolver.responseMappingTemplate,
                        ),
                    })
                }
            })
        }
    }

    createDataSources() {
        this.dataSources = {}

        // create datasource of type "lambda"
        this.dataSources.lambda = new appSync.LambdaDataSource(
            this,
            `${this.resourcesPrefixCamel}LambdaDatasource`,
            {
                api: this.graphqlApi,
                name: `${this.resourcesPrefixCamel}LambdaDataSource`,
                lambdaFunction: this.directResolverFn,
                serviceRole: this.apiRole,
            },
        )

        // create datasource of type "none"
        this.dataSources.none = new appSync.NoneDataSource(this, `${this.resourcesPrefixCamel}NoneDatasource`, {
            api: this.graphqlApi,
            name: `${this.resourcesPrefixCamel}NoneDataSource`,
        })
    }
}
