import * as nunjucks from 'nunjucks'
import * as prettier from 'prettier'
import { plural } from 'pluralize'
import { DMMF } from '@prisma/generator-helper'
import { load as loadYaml } from 'js-yaml'
import {
    DMMFPAS,
    DMMFPAS_Field,
    DMMFPAS_Comments,
    CompilerOptions,
    CompilerOptionsPrivate,
    DMMFPAS_CustomResolver,
} from './types'
// import { parseAnnotations } from 'graphql-annotations'
import { join, extname, basename, dirname } from 'path'
import { readFile, outputFile, writeFile, readFileSync, copy, openSync, writeSync, close } from 'fs-extra'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import merge from 'lodash/merge'
// import { inspect } from 'util'
import { replaceAll } from '../../packages/client/utils'

// AppSync schema helper
const { convertSchemas } = require('appsync-schema-converter')

// Custom lodash function
const pascalCase = flow(camelCase, upperFirst)

export class PrismaAppSyncCompiler {
    private dmmf: DMMF.Document
    private data: DMMFPAS
    private options: CompilerOptionsPrivate

    // Class constructor (entry point)
    constructor(dmmf: DMMF.Document, options: CompilerOptions) {
        this.options = {
            schemaPath: options.schemaPath || process.cwd(),
            outputDir: options.outputDir || join(process.cwd(), 'generated/prisma-appsync'),
            defaultDirective: options.defaultDirective || String(),
            debug: typeof options.debug !== 'undefined' ? options.debug : false,
            template: {
                model: {
                    directives: ['model'],
                },
                fields: {
                    directives: ['fields'],
                },
                queries: {
                    directives: ['queries', 'model'],
                },
                mutations: {
                    directives: ['mutations', 'model'],
                },
                subscriptions: {
                    directives: ['subscriptions', 'model'],
                },
                create: {
                    label: ({ name }) => `create${name}`,
                    directives: ['create', 'mutations', 'model'],
                },
                createMany: {
                    label: ({ pluralizedName }) => `createMany${pluralizedName}`,
                    directives: ['createMany', 'mutations', 'model'],
                },
                update: {
                    label: ({ name }) => `update${name}`,
                    directives: ['update', 'mutations', 'model'],
                },
                updateMany: {
                    label: ({ pluralizedName }) => `updateMany${pluralizedName}`,
                    directives: ['updateMany', 'mutations', 'model'],
                },
                upsert: {
                    label: ({ name }) => `upsert${name}`,
                    directives: ['upsert', 'mutations', 'model'],
                },
                delete: {
                    label: ({ name }) => `delete${name}`,
                    directives: ['delete', 'mutations', 'model'],
                },
                deleteMany: {
                    label: ({ pluralizedName }) => `deleteMany${pluralizedName}`,
                    directives: ['deleteMany', 'mutations', 'model'],
                },
                get: {
                    label: ({ name }) => `get${name}`,
                    directives: ['get', 'queries', 'model'],
                },
                list: {
                    label: ({ pluralizedName }) => `list${pluralizedName}`,
                    directives: ['list', 'queries', 'model'],
                },
                count: {
                    label: ({ pluralizedName }) => `count${pluralizedName}`,
                    directives: ['count', 'queries', 'model'],
                },
                onCreated: {
                    label: ({ name }) => `onCreated${name}`,
                    directives: ['onCreated', 'subscriptions', 'model'],
                },
                onUpdated: {
                    label: ({ name }) => `onUpdated${name}`,
                    directives: ['onUpdated', 'subscriptions', 'model'],
                },
                onUpserted: {
                    label: ({ name }) => `onUpserted${name}`,
                    directives: ['onUpserted', 'subscriptions', 'model'],
                },
                onDeleted: {
                    label: ({ name }) => `onDeleted${name}`,
                    directives: ['onDeleted', 'subscriptions', 'model'],
                },
                onMutated: {
                    label: ({ name }) => `onMutated${name}`,
                    directives: ['onMutated', 'subscriptions', 'model'],
                },
                onCreatedMany: {
                    label: ({ pluralizedName }) => `onCreatedMany${pluralizedName}`,
                    directives: ['onCreatedMany', 'subscriptions', 'model'],
                },
                onUpdatedMany: {
                    label: ({ pluralizedName }) => `onUpdatedMany${pluralizedName}`,
                    directives: ['onUpdatedMany', 'subscriptions', 'model'],
                },
                onMutatedMany: {
                    label: ({ pluralizedName }) => `onMutatedMany${pluralizedName}`,
                    directives: ['onMutatedMany', 'subscriptions', 'model'],
                },
                onDeletedMany: {
                    label: ({ pluralizedName }) => `onDeletedMany${pluralizedName}`,
                    directives: ['onDeletedMany', 'subscriptions', 'model'],
                },
            },
        }
        this.dmmf = dmmf
        this.data = {
            models: [],
            enums: [],
            customResolvers: [],
        }

        if (!(process?.env?.PRISMA_APPSYNC === 'false')) {
            this.parseDMMF()
        }

        return this
    }

    // Generate and output AppSync schema
    public async makeSchema(customSchemaPath?: string): Promise<this> {
        // generate schema
        const generatorSchemaPath = await this.makeFile(join(__dirname, './templates/schema.gql.njk'))

        if (customSchemaPath) {
            if (this.options.debug) {
                console.log(
                    `[Prisma-AppSync] Adding custom schema: `,
                    join(dirname(this.options.schemaPath), customSchemaPath),
                )
            }

            // read custom user schema
            const userSchema = await readFile(join(dirname(this.options.schemaPath), customSchemaPath), {
                encoding: 'utf-8',
            })

            // read generated schema
            const generatedSchema = await readFile(generatorSchemaPath, { encoding: 'utf-8' })

            // Merge both schema into one
            const mergedSchema = await convertSchemas([generatedSchema, userSchema], {
                commentDescriptions: true,
                includeDirectives: true,
            })

            // Prettify schema output
            const prettySchema = prettier.format(mergedSchema, {
                semi: false,
                parser: 'graphql',
                tabWidth: 4,
                trailingComma: 'none',
                singleQuote: true,
                printWidth: 60,
            })

            // Overrite generator schema with the new one
            await writeFile(generatorSchemaPath, prettySchema)
        }

        return this
    }

    // Return the AppSync client config
    public getClientConfig(): string {
        const config = {
            prismaClientModels: {},
        }

        for (let i = 0; i < this.data.models.length; i++) {
            const model = this.data.models[i]

            if (model.name !== model.pluralizedName) {
                config['prismaClientModels'][model.pluralizedName] = model.prismaRef
            }

            config['prismaClientModels'][model.name] = model.prismaRef
        }

        return JSON.stringify(config)
    }

    // Generate and output AppSync resolvers
    public async makeResolvers(customResolversPath?: string): Promise<this> {
        if (customResolversPath) {
            if (this.options.debug) {
                console.log(
                    `[Prisma-AppSync] Adding custom resolver: `,
                    join(dirname(this.options.schemaPath), customResolversPath),
                )
            }

            // Read user-defined custom resolvers
            this.data.customResolvers = loadYaml(
                readFileSync(join(dirname(this.options.schemaPath), customResolversPath), { encoding: 'utf8' }),
            ) as DMMFPAS_CustomResolver[]
        }

        // generate resolvers
        await this.makeFile(join(__dirname, './templates/resolvers.yaml.njk'))

        return this
    }

    // Generate client code for the Lambda resolver
    public async makeClient(): Promise<this> {
        await copy(join(__dirname, './prisma-appsync'), join(this.options.outputDir, 'client'))

        // edit output to inject env var at beginning
        const clientPath = join(this.options.outputDir, 'client', 'index.js')
        const clientContent = readFileSync(clientPath)
        const clientDescriptor = openSync(clientPath, 'w+')
        const clientConfig = Buffer.from(
            `process.env.PRISMA_APPSYNC_GENERATED_CONFIG=${JSON.stringify(this.getClientConfig())};`,
        )
        writeSync(clientDescriptor, clientConfig, 0, clientConfig.length, 0)
        writeSync(clientDescriptor, clientContent, 0, clientContent.length, clientConfig.length)
        close(clientDescriptor)

        return this
    }

    // Generate and output API documentation
    public async makeDocs(): Promise<this> {
        // generate main readme file
        await this.makeFile(join(__dirname, './templates/docs/README.md.njk'), { outputDir: 'docs' })

        // generate doc for each model
        for (let i = 0; i < this.data.models.length; i++) {
            const model = this.data.models[i]
            await this.makeFile(join(__dirname, './templates/docs/model.md.njk'), {
                data: { model },
                outputFilename: `${model.name}.md`,
                outputDir: 'docs',
            })
        }

        return this
    }

    // Read directives from comments
    private parseComments(directives?: string): DMMFPAS_Comments {
        let gql = {}
        let auth = {}

        const gqlRegex = /@(?:gql)\(([^)]+)\)/gm
        const authRegex = /@(?:auth)\(([^)]+)\)/gm

        const find = ['apiKey', 'userPools']
        const replace = ['"apiKey"', '"userPools"']

        if (directives) {
            const gqlDirectives = directives.match(gqlRegex)

            if (gqlDirectives) {
                for (let i = 0; i < gqlDirectives.length; i++) {
                    const str = replaceAll(gqlDirectives[i].replace(gqlRegex, '$1'), find, replace)
                    gql = merge({}, gql, new Function('return ({' + str + '})')())
                }
            }

            const authDirectives = directives.match(authRegex)

            if (authDirectives) {
                for (let j = 0; j < authDirectives.length; j++) {
                    const str = replaceAll(authDirectives[j].replace(authRegex, '$1'), find, replace)
                    auth = merge({}, auth, new Function('return ({' + str + '})')())
                }
            }
        }

        return { auth, gql }
    }

    // Convert directive rules into string
    private getDirectives(directivesObject: object): object {
        const directivesOutput: object = {}

        for (const key in this.options.template) {
            if (Object.prototype.hasOwnProperty.call(this.options.template, key)) {
                const parentKeys = this.options.template[key].directives

                for (let i = 0; i < parentKeys.length; i++) {
                    const parentKey = parentKeys[i]
                    directivesOutput[key] = this.options.defaultDirective

                    if (typeof directivesObject[parentKey] !== 'undefined') {
                        const parentKeyDirectives = Array.isArray(directivesObject[parentKey])
                            ? directivesObject[parentKey]
                            : [directivesObject[parentKey]]
                        const outputDirectives: string[] = []

                        for (let j = 0; j < parentKeyDirectives.length; j++) {
                            const directive = parentKeyDirectives[j]

                            if (directive?.allow === 'apiKey') {
                                outputDirectives.push('@aws_api_key')
                            } else if (directive?.allow === 'iam') {
                                outputDirectives.push('@aws_iam')
                            } else if (directive?.allow === 'oidc') {
                                outputDirectives.push('@aws_oidc')
                            } else if (directive?.allow === 'userPools') {
                                if (directive?.groups && Array.isArray(directive.groups)) {
                                    outputDirectives.push(
                                        `@aws_cognito_user_pools(cognito_groups: [${directive.groups
                                            .map((g) => `"${g}"`)
                                            .join(', ')}])`,
                                    )
                                } else {
                                    outputDirectives.push('@aws_cognito_user_pools')
                                }
                            }
                        }

                        directivesOutput[key] = outputDirectives.join(' ')
                        break
                    }
                }
            }
        }

        return directivesOutput
    }

    // Parse data from Prisma DMMF
    private parseDMMF(): this {
        // models
        this.dmmf.datamodel.models.forEach((model: DMMF.Model) => {
            const fields: DMMFPAS_Field[] = []
            const comments: DMMFPAS_Comments = this.parseComments(model['documentation'])
            const authDirectives: any = comments.auth
            const gqlConfig: any = comments.gql
            const isModelIgnored = gqlConfig?.model === null

            if (!isModelIgnored) {
                const directives = this.getDirectives(authDirectives)

                model.fields.forEach((field: DMMF.Field) => {
                    const isFieldIgnored = gqlConfig?.fields?.[field.name] === null

                    if (!field.isGenerated && !isFieldIgnored) {
                        fields.push({
                            name: field.name,
                            scalar: this.getFieldScalar(field),
                            isRequired: this.isFieldRequired(field),
                            isEnum: this.isFieldEnum(field),
                            isEditable: !this.isFieldGeneratedRelation(field, model) && !this.isFieldImmutable(field),
                            isUnique: this.isFieldUnique(field, model),
                            ...(field.relationName && {
                                relation: {
                                    name: this.getFieldRelationName(field, model),
                                    kind: this.getFieldRelationKind(field),
                                    type: this.getFieldType(field),
                                },
                            }),
                            directives: directives,
                            sample: this.getFieldSample(field),
                        })
                    }
                })

                const name = pascalCase(model.name)
                const pluralizedName = pascalCase(plural(model.name))

                let gql = {}
                for (const key in this.options.template) {
                    if (Object.prototype.hasOwnProperty.call(this.options.template, key)) {
                        if (typeof this.options.template[key].label !== 'undefined') {
                            gql[key] = this.options.template[key].label!({ name, pluralizedName })
                        }
                    }
                }

                this.data.models.push({
                    name,
                    pluralizedName,
                    prismaRef: model.name.charAt(0).toLowerCase() + model.name.slice(1),
                    directives,
                    idFields: model.idFields,
                    fields: fields,
                    operationFields: fields.filter(
                        (f) => f.isEditable && !f.relation && ['Int', 'Float'].includes(f.scalar),
                    ),
                    gql,
                    isEditable: fields.filter((f) => f.isEditable).length > 0,
                    subscriptionFields: this.filterSubscriptionFields(fields, model.idFields),
                })
            }
        })

        // enums
        this.dmmf.datamodel.enums.forEach((enumerated: DMMF.DatamodelEnum) => {
            const enumValues: string[] = enumerated.values.map((v) => v.name)

            this.data.enums.push({
                name: enumerated.name,
                values: enumValues,
            })
        })

        // console.log(inspect(this.data, false, null, true))

        return this
    }

    // Return fields for subscription
    private filterSubscriptionFields(fields: DMMFPAS_Field[], idFields?: string[]): DMMFPAS_Field[] {
        const subFields: DMMFPAS_Field[] = []
        const maxFields: number = 5

        let shouldContinue: boolean = true
        let currentIndex: number = 0

        while (shouldContinue) {
            shouldContinue = false

            const field: DMMFPAS_Field = fields[currentIndex]

            if (typeof field !== 'undefined' && !field.relation && field.isUnique) {
                subFields.push(field)
            }
            currentIndex++

            const hasRemainingFields: boolean = currentIndex < fields.length
            const isBelowMaxFieldsLimit: boolean = subFields.length < maxFields
            const hasMultipleIds: boolean =
                subFields.findIndex((s) => s.name === 'uuid') > -1 && subFields.findIndex((s) => s.name === 'id') > -1

            if (hasRemainingFields && isBelowMaxFieldsLimit) {
                shouldContinue = true
            } else if (hasRemainingFields && !isBelowMaxFieldsLimit && hasMultipleIds) {
                const destroyIndex = subFields.findIndex((s) => s.name === 'uuid')
                if (destroyIndex > -1) subFields.splice(destroyIndex, 1)
                shouldContinue = true
            } else if (hasRemainingFields && !isBelowMaxFieldsLimit && idFields && idFields.length > 0) {
                subFields.push({
                    name: idFields.join('_'),
                    scalar: `${idFields.join('_')}FieldsInput!`,
                    isEnum: false,
                    isRequired: true,
                    isEditable: false,
                    isUnique: true,
                    sample: `2`,
                })
            }
        }

        return subFields
    }

    // Return true if field is unique (meaning it can be used for WhereUniqueInputs)
    private isFieldUnique(searchField: DMMF.Field, model: DMMF.Model): boolean {
        return searchField.isId || searchField.isUnique || this.isFieldGeneratedRelation(searchField, model)
    }

    // Return true if field is required
    private isFieldRequired(searchField: DMMF.Field): boolean {
        return searchField.isRequired && !(searchField.relationName && searchField.isList)
    }

    // Return true if field is an enum type
    private isFieldEnum(searchField: DMMF.Field): boolean {
        return searchField.kind === 'enum'
    }

    // Return true if field shouldn't be mutated manually (e.g. `updatedAt`)
    private isFieldImmutable(searchField: DMMF.Field): boolean {
        const defaultValue: any = searchField?.default || null
        return (
            defaultValue?.name === 'autoincrement' ||
            searchField.isUpdatedAt ||
            ['updatedAt', 'createdAt'].includes(searchField.name)
        )
    }

    // Return true if field is generated by Prisma (e.g. `authorId` relationship)
    private isFieldGeneratedRelation(searchField: DMMF.Field, model: DMMF.Model): boolean {
        return (
            model.fields.findIndex((field: DMMF.Field) => {
                return field.relationFromFields && field.relationFromFields.includes(searchField.name)
            }) > -1
        )
    }

    // Compile and output file
    private async makeFile(
        inputFile: string,
        outputFileOptions?: { data?: any; outputFilename?: string; outputDir?: string },
    ): Promise<string> {
        const inputContent: string = await readFile(inputFile, { encoding: 'utf8' })

        const env = nunjucks.configure({ autoescape: true })
        env.addFilter('pascalCase', (str: string) => pascalCase(str))

        let outputContent: string = nunjucks.renderString(
            inputContent.trim(),
            outputFileOptions && outputFileOptions.data ? outputFileOptions.data : this.data,
        )

        const outputFilename: string =
            outputFileOptions && outputFileOptions.outputFilename
                ? outputFileOptions.outputFilename
                : basename(inputFile.replace('.njk', ''))

        let parserOpt: prettier.RequiredOptions['parser'] | boolean

        switch (extname(outputFilename)) {
            case '.ts':
                parserOpt = 'typescript'
                break
            case '.json':
                parserOpt = 'json'
                break
            case '.gql':
                parserOpt = 'graphql'
                break
            case '.md':
                parserOpt = 'markdown'
                break
            case '.yaml':
                parserOpt = 'yaml'
                break
            case '.js':
                parserOpt = 'babel'
                break
            default:
                parserOpt = false
                break
        }

        // pretiffy output
        outputContent = parserOpt
            ? prettier.format(outputContent, {
                  semi: false,
                  parser: parserOpt,
                  tabWidth: 4,
                  trailingComma: 'none',
                  singleQuote: true,
                  printWidth: 60,
              })
            : outputContent

        const outputFilePath = join(
            this.options.outputDir,
            outputFileOptions && outputFileOptions.outputDir ? outputFileOptions.outputDir : ``,
            outputFilename,
        )

        await outputFile(outputFilePath, outputContent)

        return outputFilePath
    }

    // Return field sample for demo/docs
    private getFieldSample(field: DMMF.Field): any {
        switch (field.type) {
            case 'Int':
                return `2`
            case 'String':
                return `"Foo"`
            case 'Json':
                return { foo: 'bar' }
            case 'Float':
                return `2.5`
            case 'Boolean':
                return `false`
            case 'DateTime':
                return `"dd/mm/YYYY"`
            default:
                return field.type
        }
    }

    // Return relation name from Prisma type
    private getFieldRelationName(field: DMMF.Field, model: DMMF.Model): string {
        return pascalCase(`${model.name} ${field.name}`)
    }

    // Return relation kind (`one` or `many`) from Prisma type
    private getFieldRelationKind(field: DMMF.Field): 'one' | 'many' {
        return field.relationFromFields && field.relationFromFields.length === 1 ? 'one' : 'many'
    }

    // Get AppSync scalar from Prisma type
    private getFieldScalar(field: DMMF.Field): string {
        let scalar: string = this.getFieldType(field)

        if (field.isList) {
            if (field.isRequired) scalar = `${scalar}!`
            scalar = `[${scalar}]`
        }

        return scalar
    }

    // Get AppSync type from Prisma type
    private getFieldType(field: DMMF.Field): string {
        let type: string = 'String'

        if (field.kind === 'scalar' && typeof field.type === 'string') {
            switch (field.type.toLocaleLowerCase()) {
                case 'int':
                    type = 'Int'
                    break
                case 'datetime':
                    type = 'AWSDateTime'
                    break
                case 'json':
                    type = 'AWSJSON'
                    break
                case 'float':
                    type = 'Float'
                    break
                case 'boolean':
                    type = 'Boolean'
                    break
                case 'string':
                    type = 'String'
                    break
            }

            if (type === 'String') {
                switch (field.name.toLocaleLowerCase()) {
                    case 'email':
                        type = 'AWSEmail'
                        break
                    case 'url':
                        type = 'AWSURL'
                        break
                }
            }
        } else if (typeof field.type === 'string') {
            type = field.type
        }

        return type
    }
}
