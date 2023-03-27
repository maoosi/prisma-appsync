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
import { isObject, isUndefined, replaceAll } from '@client/utils'
import type { InjectedConfig } from '@client/defs'
import type {
    CompilerOptions,
    CompilerOptionsPrivate,
    Document,
    Document_Comments,
    Document_CustomResolver,
    Document_Field,
    Document_Model,
    Document_UniqueIndexes,
} from './types'

// AppSync schema helper
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { convertSchemas } = require('appsync-schema-converter')

// Custom lodash function
const pascalCase = flow(camelCase, upperFirst)

export class PrismaAppSyncCompiler {
    private dmmf: DMMF.Document
    private document: Document
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

        this.document = {
            models: [],
            enums: [],
            customResolvers: [],
            defaultAuthDirective: '',
            usesQueries: false,
            usesMutations: false,
            usesSubscriptions: false,
            previewFeatures: options?.previewFeatures || [],
        }

        if (!(process?.env?.PRISMA_APPSYNC === 'false'))
            this.parseDMMF()

        return this
    }

    // Parse data from Prisma DMMF
    private parseDMMF(): this {
        const defaultDirective: Document_Comments = this.parseComments(this.options.defaultDirective)
        this.document.defaultAuthDirective = this.getDirectives(defaultDirective.auth)

        // models
        this.dmmf.datamodel.models.forEach((model: DMMF.Model) => {
            const fields: Document_Field[] = []
            const comments: Document_Comments = this.parseComments(model.documentation)
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
                            type: field.type,
                            scalar: gqlConfig?._scalars?.[field.name] || this.getFieldScalar(field),
                            isRequired: this.isFieldRequired(field),
                            isAutopopulated: this.isFieldAutoPopulated(field),
                            isList: this.isFieldList(field),
                            isEnum: this.isFieldEnum(field),
                            isEditable: !this.isFieldGeneratedRelation(field, model),
                            isUnique: this.isFieldUnique(field),
                            ...(field.relationName && {
                                relation: {
                                    name: this.getFieldRelationName(field, model),
                                    kind: this.getFieldRelationKind(field),
                                    type: this.getFieldScalar(field),
                                },
                            }),
                            directives,
                        })
                    }
                })

                this.document.models.push({
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

            this.document.enums.push({
                name: enumerated.name,
                values: enumValues,
            })
        })

        // remove fields with broken relations (e.g. related model does not exist)
        this.document.models = this.document.models.map((model: Document_Model) => {
            model.fields = model.fields.filter((field: Document_Field) => {
                if (field?.relation) {
                    const modelExists = this.document.models.find((searchModel: Document_Model) => {
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
        this.document.models.forEach((model: Document_Model) => {
            if (this.document.usesQueries === false && model.gql._usesQueries === true)
                this.document.usesQueries = true

            if (this.document.usesMutations === false && model.gql._usesMutations === true)
                this.document.usesMutations = true

            if (this.document.usesSubscriptions === false && model.gql._usesSubscriptions === true)
                this.document.usesSubscriptions = true
        })

        return this
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
            fieldsMapping: {},
            operations: String(),
        }

        const operationsList: string[] = []

        for (let i = 0; i < this.document.models.length; i++) {
            const model = this.document.models[i]
            const modelDefition = {
                prismaRef: model.prismaRef,
                singular: model.name,
                plural: model.pluralizedName,
            }

            if (model.name !== model.pluralizedName)
                injectedConfig.modelsMapping[model.pluralizedName] = modelDefition

            injectedConfig.modelsMapping[model.name] = modelDefition

            for (let j = 0; j < Object.keys(model.gql).length; j++) {
                const key = Object.keys(model.gql)[j]
                const operation = model.gql[key]

                if (typeof operation === 'string') {
                    if (!operationsList.includes(operation))
                        operationsList.push(operation)
                }

                for (let k = 0; k < model.fields.length; k++) {
                    const field = model.fields[k]

                    if (
                        field.type && ![
                            '_model', '_fields', '_usesQueries', '_usesMutations', '_usesSubscriptions',
                        ].includes(key)
                    ) {
                        injectedConfig.fieldsMapping[`${operation}/${field.name}`] = {
                            type: field.type, isRelation: !!field?.relation,
                        }
                    }
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
            this.document.customResolvers = loadYaml(
                readFileSync(join(dirname(this.options.schemaPath), customResolversPath), { encoding: 'utf8' }),
            ) as Document_CustomResolver[]
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

    // Read directives from comments
    private parseComments(directives?: string): Document_Comments {
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
            _scalars: any
            _usesQueries: boolean
            _usesMutations: boolean
            _usesSubscriptions: boolean
            [key: string]: any
        } = {
            _model: gqlObject?.model !== null,
            _fields: gqlObject?.fields || {},
            _scalars: gqlObject?.scalars || {},
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
                // You can’t use the @aws_auth directive along with additional authorization modes. @aws_auth works only in the context of AMAZON_COGNITO_USER_POOLS authorization with no additional authorization modes.
                // https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html
                const cognitoDirective = directivesObjects.some(d => d.allow !== 'userPools')
                    ? '@aws_cognito_user_pools'
                    : '@aws_auth'

                if (directive?.groups && Array.isArray(directive.groups)) {
                    outputDirectives.push(
                        `${cognitoDirective}(cognito_groups: [${directive.groups.map((g: string) => `"${g}"`).join(', ')}])`,
                    )
                }
                else {
                    outputDirectives.push(cognitoDirective)
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

    // Return fields for subscription
    private filterSubscriptionFields(
        fields: Document_Field[],
        uniqueIndexes?: Document_UniqueIndexes[],
    ): Document_Field[] {
        const subFields: Document_Field[] = []
        const maxFields = 5

        let shouldContinue = true
        let currentIndex = 0

        while (shouldContinue) {
            shouldContinue = false

            const field: Document_Field = fields[currentIndex]

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
                        type: undefined,
                        scalar: `${i.fields.join('_')}FieldsInput`,
                        isEnum: false,
                        isList: false,
                        isRequired: true,
                        isEditable: false,
                        isUnique: true,
                        isAutopopulated: true,
                    }),
                )
            }
        }

        return subFields
    }

    // Return true if field is unique (meaning it can be used for WhereUniqueInputs)
    private isFieldUnique(searchField: DMMF.Field): boolean {
        return searchField.isId || searchField.isUnique
    }

    // Return true if field is required
    private isFieldRequired(searchField: DMMF.Field): boolean {
        return searchField.isRequired && !searchField.isList
    }

    // Return true if field is an enum type
    private isFieldEnum(searchField: DMMF.Field): boolean {
        return searchField.kind === 'enum'
    }

    // Return true if field doesn't need to be mutated manually (e.g. `updatedAt`)
    private isFieldAutoPopulated(searchField: DMMF.Field): boolean {
        return Boolean(
            typeof searchField?.default !== 'undefined' || searchField?.isUpdatedAt,
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

    // Return true if field is a List (array)
    private isFieldList(searchField: DMMF.Field): boolean {
        return searchField.isList
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
            outputFileOptions && outputFileOptions.data ? outputFileOptions.data : this.document,
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

    // Return relation name from Prisma type
    private getFieldRelationName(field: DMMF.Field, model: DMMF.Model): string {
        return pascalCase(`${model.name} ${field.name}`)
    }

    // Return relation kind (`one` or `many`) from Prisma type
    private getFieldRelationKind(field: DMMF.Field): 'one' | 'many' {
        return !field.isList ? 'one' : 'many'
    }

    // Get AppSync scalar from Prisma type
    private getFieldScalar(field: DMMF.Field): string {
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
