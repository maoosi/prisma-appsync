/* eslint-disable no-console */
import { basename, dirname, extname, join } from 'path'
import { load as loadYaml } from 'js-yaml'
import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import * as prettier from 'prettier'
import * as nunjucks from 'nunjucks'
import { copy, outputFile, readFile, readFileSync, writeFile, writeFileSync } from 'fs-extra'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
// import { inspect } from 'util'
import { isObject, isUndefined, replaceAll } from '@client/utils'
import type { InjectedConfig } from '@client/defs'
import type {
    CompilerOptions,
    CompilerOptionsPrivate,
    DMMFPAS,
    DMMFPAS_Comments,
    DMMFPAS_CustomResolver,
    DMMFPAS_Field,
    DMMFPAS_Model,
    DMMFPAS_UniqueIndexes,
} from './types'

// AppSync schema helper
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convertSchemas } = require('appsync-schema-converter')

// Custom lodash function
const pascalCase = flow(camelCase, upperFirst)

export class PrismaAppSyncCompiler {
    private dmmf: DMMF.Document
    private data: DMMFPAS
    private options: CompilerOptionsPrivate

    // Class constructor (entry point)
    constructor(dmmf: DMMF.Document, options: CompilerOptions) {
        const schemaPath = options.schemaPath || process.cwd()

        this.options = {
            schemaPath,
            outputDir: options.outputDir || join(dirname(schemaPath), '/generated/prisma-appsync'),
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
                    type: 'Mutation',
                },
                createMany: {
                    label: ({ pluralizedName }) => `createMany${pluralizedName}`,
                    directives: ['createMany', 'mutations', 'model'],
                    type: 'Mutation',
                },
                update: {
                    label: ({ name }) => `update${name}`,
                    directives: ['update', 'mutations', 'model'],
                    type: 'Mutation',
                },
                updateMany: {
                    label: ({ pluralizedName }) => `updateMany${pluralizedName}`,
                    directives: ['updateMany', 'mutations', 'model'],
                    type: 'Mutation',
                },
                upsert: {
                    label: ({ name }) => `upsert${name}`,
                    directives: ['upsert', 'mutations', 'model'],
                    type: 'Mutation',
                },
                delete: {
                    label: ({ name }) => `delete${name}`,
                    directives: ['delete', 'mutations', 'model'],
                    type: 'Mutation',
                },
                deleteMany: {
                    label: ({ pluralizedName }) => `deleteMany${pluralizedName}`,
                    directives: ['deleteMany', 'mutations', 'model'],
                    type: 'Mutation',
                },
                get: {
                    label: ({ name }) => `get${name}`,
                    directives: ['get', 'queries', 'model'],
                    type: 'Query',
                },
                list: {
                    label: ({ pluralizedName }) => `list${pluralizedName}`,
                    directives: ['list', 'queries', 'model'],
                    type: 'Query',
                },
                count: {
                    label: ({ pluralizedName }) => `count${pluralizedName}`,
                    directives: ['count', 'queries', 'model'],
                    type: 'Query',
                },
                onCreated: {
                    label: ({ name }) => `onCreated${name}`,
                    directives: ['onCreated', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onUpdated: {
                    label: ({ name }) => `onUpdated${name}`,
                    directives: ['onUpdated', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onUpserted: {
                    label: ({ name }) => `onUpserted${name}`,
                    directives: ['onUpserted', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onDeleted: {
                    label: ({ name }) => `onDeleted${name}`,
                    directives: ['onDeleted', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onMutated: {
                    label: ({ name }) => `onMutated${name}`,
                    directives: ['onMutated', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onCreatedMany: {
                    label: ({ pluralizedName }) => `onCreatedMany${pluralizedName}`,
                    directives: ['onCreatedMany', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onUpdatedMany: {
                    label: ({ pluralizedName }) => `onUpdatedMany${pluralizedName}`,
                    directives: ['onUpdatedMany', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onMutatedMany: {
                    label: ({ pluralizedName }) => `onMutatedMany${pluralizedName}`,
                    directives: ['onMutatedMany', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
                onDeletedMany: {
                    label: ({ pluralizedName }) => `onDeletedMany${pluralizedName}`,
                    directives: ['onDeletedMany', 'subscriptions', 'model'],
                    type: 'Subscription',
                },
            },
        }
        this.dmmf = dmmf
        this.data = {
            models: [],
            enums: [],
            customResolvers: [],
            defaultAuthDirective: '',
            usesQueries: false,
            usesMutations: false,
            usesSubscriptions: false,
        }

        if (!(process?.env?.PRISMA_APPSYNC === 'false'))
            this.parseDMMF()

        return this
    }

    // Return config
    public getConfig() {
        return {
            models: this.data.models.map((m: DMMFPAS_Model) => {
                return omit(m, ['fields'])
            }),
            enums: this.data.enums,
            customResolvers: this.data.customResolvers,
            defaultAuthDirective: this.data.defaultAuthDirective,
            usesQueries: this.data.usesQueries,
            usesMutations: this.data.usesMutations,
            usesSubscriptions: this.data.usesSubscriptions,
        }
    }

    // Generate and output AppSync schema
    public async makeSchema(customSchemaPath?: string): Promise<this> {
        // generate schema
        const generatorSchemaPath = await this.makeFile(join(__dirname, './templates/schema.gql.njk'))

        if (customSchemaPath) {
            if (this.options.debug) {
                console.log(
                    '[Prisma-AppSync] Adding custom schema: ',
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

    private replaceInFile(file: string, findRegex: RegExp, replace: string) {
        const content = readFileSync(file, 'utf-8')
        const newContent = content.replace(findRegex, replace)
        writeFileSync(file, newContent, 'utf-8')
        return newContent
    }

    public getInjectedConfig(): Required<InjectedConfig> {
        const injectedConfig: Required<InjectedConfig> = {
            modelsMapping: {},
            operations: String(),
        }

        const operationsList: string[] = []

        for (let i = 0; i < this.data.models.length; i++) {
            const model = this.data.models[i]

            if (model.name !== model.pluralizedName)
                injectedConfig.modelsMapping[model.pluralizedName] = model.prismaRef

            injectedConfig.modelsMapping[model.name] = model.prismaRef

            for (let i = 0; i < Object.keys(model.gql).length; i++) {
                const key = Object.keys(model.gql)[i]
                const operation = model.gql[key]

                if (typeof operation === 'string') {
                    if (!operationsList.includes(operation))
                        operationsList.push(operation)
                }
            }
        }

        injectedConfig.operations = operationsList
            .sort()
            .map((o: string) => `"${o}"`)
            .join(' | ')

        return injectedConfig
    }

    // Generate and output AppSync resolvers
    public async makeResolvers(customResolversPath?: string): Promise<this> {
        if (customResolversPath) {
            if (this.options.debug) {
                console.log(
                    '[Prisma-AppSync] Adding custom resolver: ',
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
        await copy(join(__dirname, './client'), join(this.options.outputDir, 'client'))

        // edit output to inject configs
        const clientPath = join(this.options.outputDir, 'client', 'index.js')
        const coreDefPath = join(this.options.outputDir, 'client', 'core.d.ts')
        const injectedConfig = this.getInjectedConfig()

        this.replaceInFile(clientPath, /((?: )*{}\;*\s*\/\/\!\s+inject:config)/g, JSON.stringify(injectedConfig))
        this.replaceInFile(
            coreDefPath,
            /((?: )*(\'|\")\/\/\!\s+inject:type:operations(\'|\"))/g,
            injectedConfig.operations,
        )

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

        const find = ['apiKey', 'userPools', 'iam', 'oidc']
        const replace = ['"apiKey"', '"userPools"', '"iam"', '"oidc"']

        if (directives) {
            const gqlDirectives = directives.match(gqlRegex)

            if (gqlDirectives) {
                for (let i = 0; i < gqlDirectives.length; i++) {
                    const str = replaceAll(gqlDirectives[i].replace(gqlRegex, '$1'), find, replace)
                    // eslint-disable-next-line no-new-func
                    gql = merge({}, gql, new Function(`return ({${str}})`)())
                }
            }

            const authDirectives = directives.match(authRegex)

            if (authDirectives) {
                for (let j = 0; j < authDirectives.length; j++) {
                    const str = replaceAll(authDirectives[j].replace(authRegex, '$1'), find, replace)
                    // eslint-disable-next-line no-new-func
                    auth = merge({}, auth, new Function(`return ({${str}})`)())
                }
            }
        }

        return { auth, gql }
    }

    // Get all GQL modeling from config
    private getGqlModeling(gqlObject: any, { name, pluralizedName }: { name: string; pluralizedName: string }): object {
        const gqlOutput: {
            _model: boolean
            _fields: any
            _usesQueries: boolean
            _usesMutations: boolean
            _usesSubscriptions: boolean
            [key: string]: any
        } = {
            _model: gqlObject?.model !== null,
            _fields: gqlObject?.fields || {},
            _usesQueries: false,
            _usesMutations: false,
            _usesSubscriptions: false,
        }

        for (const key in this.options.template) {
            if (
                Object.prototype.hasOwnProperty.call(this.options.template, key)
                && !isUndefined(this.options.template?.[key]?.directives)
                && !isUndefined(this.options.template[key]?.label)
                && !isUndefined(this.options.template[key]?.type)
            ) {
                const groups = this.options.template[key].directives
                const defaultValue = this.options.template[key].label!({ name, pluralizedName })
                const type = this.options.template[key].type

                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i]
                    const childGroup = i > 0 ? groups[i - 1] : undefined

                    gqlOutput[key] = defaultValue

                    // Example: @gql(mutations: null)
                    if (typeof gqlObject[group] !== 'undefined' && gqlObject[group] === null) {
                        gqlOutput[key] = gqlObject[group]

                        break
                    }
                    // Example: @gql(queries: { count: "county" })
                    else if (
                        childGroup !== undefined
                        && !isUndefined(gqlObject?.[group]?.[childGroup])
                        && !isObject(gqlObject[group][childGroup])
                    ) {
                        gqlOutput[key] = gqlObject[group][childGroup]

                        break
                    }
                }

                if (type === 'Query' && gqlOutput._usesQueries === false && gqlOutput[key] !== null)
                    gqlOutput._usesQueries = true

                if (type === 'Mutation' && gqlOutput._usesMutations === false && gqlOutput[key] !== null)
                    gqlOutput._usesMutations = true

                if (type === 'Subscription' && gqlOutput._usesSubscriptions === false && gqlOutput[key] !== null)
                    gqlOutput._usesSubscriptions = true
            }
        }

        if (gqlOutput._usesMutations === false)
            gqlOutput._usesSubscriptions = false

        return gqlOutput
    }

    // Converts directives objects into appsync directive strings
    private parseDirectives(directivesObjects: any[]): string {
        const outputDirectives: string[] = []

        for (let j = 0; j < directivesObjects.length; j++) {
            const directive = directivesObjects[j]

            if (directive?.allow === 'apiKey') {
                outputDirectives.push('@aws_api_key')
            }
            else if (directive?.allow === 'iam') {
                outputDirectives.push('@aws_iam')
            }
            else if (directive?.allow === 'oidc') {
                outputDirectives.push('@aws_oidc')
            }
            else if (directive?.allow === 'userPools') {
                if (directive?.groups && Array.isArray(directive.groups)) {
                    outputDirectives.push(
                        `@aws_cognito_user_pools(cognito_groups: [${directive.groups
                            .map((g: string) => `"${g}"`)
                            .join(', ')}])`,
                    )
                }
                else {
                    outputDirectives.push('@aws_cognito_user_pools')
                }
            }
        }

        return outputDirectives.join(' ')
    }

    // Get all directives from config
    private getDirectives(directivesObject: any): any {
        const directivesOutput: any = {}

        for (const key in this.options.template) {
            if (Object.prototype.hasOwnProperty.call(this.options.template, key)) {
                const parentKeys = this.options.template[key].directives

                for (let i = 0; i < parentKeys.length; i++) {
                    const parentKey = parentKeys[i]
                    directivesOutput[key] = ''

                    if (typeof directivesObject[parentKey] !== 'undefined') {
                        const parentKeyDirectives = Array.isArray(directivesObject[parentKey])
                            ? directivesObject[parentKey]
                            : [directivesObject[parentKey]]

                        directivesOutput[key] = this.parseDirectives(parentKeyDirectives)
                        break
                    }
                }
            }
        }

        return directivesOutput
    }

    // Parse data from Prisma DMMF
    private parseDMMF(): this {
        const defaultDirective: DMMFPAS_Comments = this.parseComments(this.options.defaultDirective)
        this.data.defaultAuthDirective = this.getDirectives(defaultDirective.auth)

        // models
        this.dmmf.datamodel.models.forEach((model: DMMF.Model) => {
            const fields: DMMFPAS_Field[] = []
            const comments: DMMFPAS_Comments = this.parseComments(model.documentation)
            const name = pascalCase(model.name)
            const pluralizedName = pascalCase(plural(model.name))
            const directives: any = this.getDirectives({ ...defaultDirective.auth, ...comments.auth })
            const gqlConfig: any = this.getGqlModeling(comments.gql, {
                name,
                pluralizedName,
            })
            const isModelIgnored = !isUndefined(gqlConfig?._model) && gqlConfig._model === false

            if (!isModelIgnored) {
                model.fields.forEach((field: DMMF.Field) => {
                    const isFieldIgnored = gqlConfig?._fields?.[field.name] === null

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
                            directives,
                            sample: this.getFieldSample(field),
                        })
                    }
                })

                this.data.models.push({
                    name,
                    pluralizedName,
                    prismaRef: model.name.charAt(0).toLowerCase() + model.name.slice(1),
                    directives,
                    uniqueIndexes: model.uniqueIndexes,
                    uniqueFields: model.uniqueFields,
                    fields,
                    operationFields: fields.filter(
                        f => f.isEditable && !f.relation && ['Int', 'Float'].includes(f.scalar),
                    ),
                    gql: gqlConfig,
                    isEditable: fields.filter(f => f.isEditable).length > 0,
                    subscriptionFields: this.filterSubscriptionFields(fields, model.uniqueIndexes),
                })
            }
        })

        // enums
        this.dmmf.datamodel.enums.forEach((enumerated: DMMF.DatamodelEnum) => {
            const enumValues: string[] = enumerated.values.map(v => v.name)

            this.data.enums.push({
                name: enumerated.name,
                values: enumValues,
            })
        })

        // remove fields with broken relations (e.g. related model does not exist)
        this.data.models = this.data.models.map((model: DMMFPAS_Model) => {
            model.fields = model.fields.filter((field: DMMFPAS_Field) => {
                if (field?.relation) {
                    const modelExists = this.data.models.find((searchModel: DMMFPAS_Model) => {
                        return searchModel.name === field?.relation?.type
                    })

                    if (!modelExists)
                        return false
                }

                return true
            })

            return model
        })

        // usesQueries / usesMutations / usesSubscriptions
        this.data.models.forEach((model: DMMFPAS_Model) => {
            if (this.data.usesQueries === false && model.gql._usesQueries === true)
                this.data.usesQueries = true

            if (this.data.usesMutations === false && model.gql._usesMutations === true)
                this.data.usesMutations = true

            if (this.data.usesSubscriptions === false && model.gql._usesSubscriptions === true)
                this.data.usesSubscriptions = true
        })

        // console.log(inspect(this.data, false, null, true))

        return this
    }

    // Return fields for subscription
    private filterSubscriptionFields(
        fields: DMMFPAS_Field[],
        uniqueIndexes?: DMMFPAS_UniqueIndexes[],
    ): DMMFPAS_Field[] {
        const subFields: DMMFPAS_Field[] = []
        const maxFields = 5

        let shouldContinue = true
        let currentIndex = 0

        while (shouldContinue) {
            shouldContinue = false

            const field: DMMFPAS_Field = fields[currentIndex]

            if (typeof field !== 'undefined' && !field.relation && field.isUnique)
                subFields.push(field)

            currentIndex++

            const hasRemainingFields: boolean = currentIndex < fields.length
            const isBelowMaxFieldsLimit: boolean = subFields.length < maxFields
            const hasMultipleIds: boolean
                = subFields.findIndex(s => s.name === 'uuid') > -1 && subFields.findIndex(s => s.name === 'id') > -1

            if (hasRemainingFields && isBelowMaxFieldsLimit) {
                shouldContinue = true
            }
            else if (hasRemainingFields && !isBelowMaxFieldsLimit && hasMultipleIds) {
                const destroyIndex = subFields.findIndex(s => s.name === 'uuid')
                if (destroyIndex > -1)
                    subFields.splice(destroyIndex, 1)
                shouldContinue = true
            }
            else if (hasRemainingFields && !isBelowMaxFieldsLimit && uniqueIndexes && uniqueIndexes.length > 0) {
                uniqueIndexes.forEach(i =>
                    subFields.push({
                        name: i.name || i.fields.join('_'),
                        scalar: `${i.fields.join('_')}FieldsInput!`,
                        isEnum: false,
                        isRequired: true,
                        isEditable: false,
                        isUnique: true,
                        sample: '2',
                    }),
                )
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
            defaultValue?.name === 'autoincrement'
            || searchField.isUpdatedAt
            || ['updatedAt', 'createdAt'].includes(searchField.name)
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

        const outputFilename: string
            = outputFileOptions && outputFileOptions.outputFilename
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
        try {
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
        }
        catch (err) {
            console.error(err)
            console.log(outputContent)
        }

        const outputFilePath = join(
            this.options.outputDir,
            outputFileOptions && outputFileOptions.outputDir ? outputFileOptions.outputDir : '',
            outputFilename,
        )

        await outputFile(outputFilePath, outputContent)

        return outputFilePath
    }

    // Return field sample for demo/docs
    private getFieldSample(field: DMMF.Field): any {
        switch (field.type) {
        case 'Int':
            return '2'
        case 'String':
            return '"Foo"'
        case 'Json':
            return { foo: 'bar' }
        case 'Float':
            return '2.5'
        case 'Boolean':
            return 'false'
        case 'DateTime':
            return '"dd/mm/YYYY"'
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
            if (field.isRequired)
                scalar = `${scalar}!`
            scalar = `[${scalar}]`
        }

        return scalar
    }

    // Get AppSync type from Prisma type
    private getFieldType(field: DMMF.Field): string {
        let type = 'String'

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
        }
        else if (this.isFieldEnum(field)) {
            type = field.type
        }
        else if (typeof field.type === 'string') {
            type = pascalCase(field.type)
        }

        return type
    }
}
