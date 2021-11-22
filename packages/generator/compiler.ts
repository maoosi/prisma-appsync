import * as nunjucks from 'nunjucks'
import * as prettier from 'prettier'
import { plural } from 'pluralize'
import { DMMF } from '@prisma/generator-helper'
import { load as loadYaml } from 'js-yaml'
import {
    DMMFPAS,
    DMMFPAS_Field,
    DMMFPAS_Directives,
    CompilerOptions,
    CompilerOptionsPrivate,
    DMMFPAS_DirectiveAliases,
    DMMFPAS_CustomResolver,
} from './types'
import { parseAnnotations } from 'graphql-annotations'
import { join, extname, basename, dirname } from 'path'
import { readFile, outputFile, writeFile, readFileSync, copy, openSync, writeSync, close } from 'fs-extra'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import merge from 'lodash/merge'

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
            directiveAliases: options.directiveAliases || {},
            schemaPath: options.schemaPath || process.cwd(),
            outputDir: options.outputDir || join(process.cwd(), 'generated/prisma-appsync'),
            directivesPriorityScheme: {
                model: {
                    type: ['type', 'default'],
                    query: ['query', 'type', 'default'],
                    mutation: ['mutation', 'type', 'default'],
                    batch: ['batch', 'mutation', 'type', 'default'],
                    subscription: ['subscription', 'type', 'default'],
                    get: ['get', 'query', 'type', 'default'],
                    list: ['list', 'query', 'type', 'default'],
                    count: ['count', 'query', 'type', 'default'],
                    create: ['create', 'mutation', 'type', 'default'],
                    update: ['update', 'mutation', 'type', 'default'],
                    upsert: ['upsert', 'mutation', 'type', 'default'],
                    delete: ['delete', 'mutation', 'type', 'default'],
                    createMany: ['createMany', 'batch', 'mutation', 'type', 'default'],
                    updateMany: ['updateMany', 'batch', 'mutation', 'type', 'default'],
                    deleteMany: ['deleteMany', 'batch', 'mutation', 'type', 'default'],
                },
                field: {
                    field: ['field'],
                },
            },
            aliasPrefix: 'directiveAlias_',
            debug: typeof options.debug !== 'undefined' ? options.debug : false,
        }
        this.dmmf = dmmf
        this.data = {
            models: [],
            enums: [],
            directiveAliases: merge({ default: String() }, this.options.directiveAliases),
            customResolvers: [],
        }

        this.parseDMMF()

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

    // Parse data from Prisma DMMF
    private parseDMMF(): this {
        // models
        this.dmmf.datamodel.models.forEach((model: DMMF.Model) => {
            const modelDirectives: DMMFPAS_Directives = this.getModelDirectives(model)
            const fields: DMMFPAS_Field[] = []

            if (!this.isIgnored(model)) {
                model.fields.forEach((field: DMMF.Field) => {
                    const fieldDirectives: DMMFPAS_Directives = this.getFieldDirectives(field, model)

                    if (!field.isGenerated && !this.isIgnored(field)) {
                        fields.push({
                            name: field.name,
                            scalar: this.getFieldScalar(field),
                            isRequired: this.isFieldRequired(field),
                            isEnum: this.isFieldEnum(field),
                            isEditable:
                                !this.isFieldGeneratedRelation(field, model) && !this.isFieldImmutableDate(field),
                            isUnique: this.isFieldUnique(field, model),
                            ...(field.relationName && {
                                relation: {
                                    name: this.getFieldRelationName(field, model),
                                    kind: this.getFieldRelationKind(field),
                                    type: this.getFieldType(field),
                                },
                            }),
                            ...(Object.keys(fieldDirectives).length > 0 && {
                                directives: fieldDirectives,
                            }),
                            sample: this.getFieldSample(field),
                        })
                    }
                })

                this.data.models.push({
                    name: pascalCase(model.name),
                    pluralizedName: pascalCase(plural(model.name)),
                    prismaRef: model.name.charAt(0).toLowerCase() + model.name.slice(1),
                    ...(Object.keys(modelDirectives).length > 0 && {
                        directives: modelDirectives,
                    }),
                    idFields: model.idFields,
                    fields: fields,
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

        // console.log( inspect(this.data, false, null, true) )

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
    private isFieldImmutableDate(searchField: DMMF.Field): boolean {
        return searchField.isId || searchField.isUpdatedAt || ['updatedAt', 'createdAt'].includes(searchField.name)
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

        if (field.kind === 'scalar') {
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
        } else {
            type = field.type
        }

        return type
    }

    // Read AppSync model directives from AST comments
    private getModelDirectives(model: DMMF.Model): DMMFPAS_Directives {
        return this.getDirectives(model, this.options.directivesPriorityScheme['model'])
    }

    // Return true if field or model is ignored /// @PrismaAppSync.ignore
    private isIgnored(node: DMMF.Field | DMMF.Model): boolean {
        let isIgnored = false

        // search .ignore annotations in Prisma doc node (AST)
        if (typeof node['documentation'] !== 'undefined' && node['documentation'].includes('@PrismaAppSync.ignore')) {
            isIgnored = true
        }

        return isIgnored
    }

    // Read AppSync field directives from AST comments
    private getFieldDirectives(field: DMMF.Field, model: DMMF.Model): DMMFPAS_Directives {
        if (field.relationName) {
            const relationModel: DMMF.Model | false = this.getModelIfExists(field.type)

            if (relationModel) {
                const modelDirectives = this.getModelDirectives(model)
                const relationModelDirectives = this.getModelDirectives(relationModel)
                const fieldDirectives: DMMFPAS_Directives = {
                    ...(modelDirectives['type'] !== relationModelDirectives['type'] && {
                        field: relationModelDirectives['type'],
                    }),
                    ...(modelDirectives['mutation'] !== relationModelDirectives['mutation'] && {
                        mutation: relationModelDirectives['mutation'],
                    }),
                    ...(modelDirectives['create'] !== relationModelDirectives['create'] && {
                        create: relationModelDirectives['create'],
                    }),
                    ...(modelDirectives['update'] !== relationModelDirectives['update'] && {
                        update: relationModelDirectives['update'],
                    }),
                }
                return fieldDirectives
            }
        }

        return this.getDirectives(field, this.options.directivesPriorityScheme['field'])
    }

    // Return DMMF model from model name
    private getModelIfExists(name: string): DMMF.Model | false {
        const modelIndex = this.dmmf.datamodel.models.findIndex((model: DMMF.Model) => {
            return model.name === name
        })
        return modelIndex > -1 ? this.dmmf.datamodel.models[modelIndex] : false
    }

    // Return directives strings
    private getDirectives(node: DMMF.Field | DMMF.Model, priorityScheme?: any): DMMFPAS_Directives {
        let directives: DMMFPAS_Directives = {}
        let annotations: any

        // search annotations in Prisma documentation node (AST)
        if (typeof node['documentation'] !== 'undefined') {
            annotations = parseAnnotations('PrismaAppSync', node['documentation'])
        }

        // format all directive aliases to with @@ prefix (except for default)
        const directiveAliases: DMMFPAS_DirectiveAliases = {}
        Object.keys(this.data.directiveAliases).forEach((alias) => {
            if (alias === 'default') directiveAliases[alias] = this.data.directiveAliases[alias]
            else directiveAliases[`@@${alias}`] = this.data.directiveAliases[alias]
        })

        // merge directive alias with annotations
        annotations = merge(annotations, directiveAliases)

        // generate directives list based on priorityScheme
        for (const schemaScope in priorityScheme) {
            if (Object.prototype.hasOwnProperty.call(priorityScheme, schemaScope)) {
                const priorityList: string[] = priorityScheme[schemaScope]

                // If we find a matching scope rule, then apply AND stop
                for (let i = 0; i < priorityList.length; i++) {
                    const scope: string = priorityList[i]

                    if (typeof annotations[scope] !== 'undefined') {
                        directives[schemaScope] = annotations[scope]
                        break
                    }
                }
            }
        }

        // replace all user aliases with matching directives
        Object.keys(directives).forEach((scope) => {
            const directive = directives[scope]
            const directiveKey = directive.replace('@@', '')

            if (/\@\@\w+/.test(directive) && typeof this.data.directiveAliases[directiveKey] !== 'undefined') {
                directives[scope] = this.data.directiveAliases[directiveKey]
            }
        })

        return directives
    }
}
