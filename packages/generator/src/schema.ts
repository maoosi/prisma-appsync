import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import { uniqBy } from '@client/utils'
import * as prettier from 'prettier'
import { type ModelDirectives, extractUniqueAuthzModes, parseModelDirectives } from './directives'

const pascalCase = flow(camelCase, upperFirst)

// AppSync schema helper
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { convertSchemas } = require('appsync-schema-converter')

export default class SchemaBuilder {
    private types: GqlType[] = []
    private inputs: GqlInput[] = []
    private enums: GqlEnum[] = []
    private queries: GqlQuery[] = []
    private mutations: GqlMutation[] = []
    private subscriptions: GqlSubscription[] = []

    public async createSchema(dmmf: DMMF.Document, options?: { defaultDirective?: string }) {
        // schema base
        this.createBaseTypes()
        this.createBaseEnums()
        this.createBaseInputs()

        // schema enums
        this.createEnumsInputs(dmmf.datamodel)
        this.createEnumsTypes(dmmf.datamodel)

        // get all schema authz modes
        const schemaAuthzModes = extractUniqueAuthzModes(dmmf.datamodel, options)

        // parse all models
        const models: ParsedModel[] = dmmf.datamodel?.models
            ?.map(modelDMMF => this.parseModelDMMF(modelDMMF, { ...options, schemaAuthzModes })) || []

        // schema models
        dmmf.datamodel?.models.forEach((modelDMMF: DMMF.Model) => {
            const model = models
                .find(m => m.singular === modelDMMF.name)

            if (model) {
                this.createModelTypes(model)
                this.createModelInputs(model, models)
                this.createModelQueries(model)
                this.createModelMutations(model)
                this.createModelSubscriptions(model)
            }
        })

        // return appsync gql schema (string)
        return await this.buildAppSyncSchema()
    }

    public async mergeSchemas(baseSchema: string, mergeSchema: string) {
        const mergedSchema = await convertSchemas([baseSchema, mergeSchema], {
            commentDescriptions: true,
            includeDirectives: true,
        })

        return this.perttyGraphQL(mergedSchema)
    }

    private perttyGraphQL(schema: string) {
        let perttyGraphQL = schema

        try {
            perttyGraphQL = prettier.format(schema, {
                semi: false,
                parser: 'graphql',
                tabWidth: 4,
                trailingComma: 'none',
                singleQuote: true,
                printWidth: 60,
            })
        }
        catch (err) {
            console.error(err)
        }

        return perttyGraphQL
    }

    private parseModelDMMF(modelDMMF: DMMF.Model, options?: { defaultDirective?: string; schemaAuthzModes?: string[] }): ParsedModel {
        const directives = parseModelDirectives({
            modelDMMF,
            defaultDirective: options?.defaultDirective || '',
            schemaAuthzModes: options?.schemaAuthzModes || [],
        })

        const fields = modelDMMF.fields.filter(field => !(directives?.gql?.fields?.[field.name] === null))

        const getScalar = (field: DMMF.Field, inject?: FieldScalarOptions) => {
            return this.getFieldScalar(field, { scalar: directives?.gql?.scalars?.[field.name], ...inject })
        }

        const uniqueComposites = [
            modelDMMF.primaryKey,
            ...modelDMMF.uniqueIndexes,
        ]
            .filter(composite => composite?.fields?.length)
            .map((composite) => {
                const compositeFields = ((composite as DMMF.PrimaryKey).fields
                    .map(compositeField => fields.find(f => f.name === compositeField))
                    .filter(Boolean)
                ) as DMMF.Field[]

                const name = (composite as DMMF.PrimaryKey)?.name
                    || compositeFields
                        .map(compositeField => compositeField.name)
                        .join('_')

                const scalar = `${pascalCase(
                    compositeFields
                        .map(compositeField => compositeField.name)
                        .join(' '),
                )}FieldsInput`

                const subfields: GqlField[] = compositeFields
                    .map((compositeField) => {
                        return {
                            name: compositeField.name,
                            scalar: getScalar(compositeField),
                        }
                    })

                return {
                    name,
                    scalar,
                    fields: subfields,
                }
            })

        const operationsFields = fields
            ?.filter(field => !field?.relationName && !field?.isReadOnly && !field.isId && ['Int', 'Float'].includes(getScalar(field)))
            ?.map(field => ({ name: field.name, scalar: getScalar(field, { after: 'Operation' }) })) || []

        const whereInputFields = fields.map((field) => {
            let scalar

            if (field?.relationName) {
                if (field.isList)
                    scalar = getScalar(field, { after: 'Filter', required: false, list: false })
                else
                    scalar = getScalar(field, { after: 'WhereInput', required: false })
            }
            else if (field.isList) {
                if (field.kind === 'enum')
                    scalar = getScalar(field, { after: 'EnumListFilter', required: false, list: false })
                else
                    scalar = getScalar(field, { after: 'ListFilter', required: false, list: false })
            }
            else {
                if (field.kind === 'enum')
                    scalar = getScalar(field, { after: 'EnumFilter', required: false })
                else
                    scalar = getScalar(field, { after: `${!field.isRequired ? 'Nullable' : ''}Filter`, required: false })
            }

            return { name: field.name, scalar }
        }).filter(field => field.scalar)

        const whereUniqueInputFields = [
            ...fields
                ?.filter(field => field?.isUnique || field?.isId)
                ?.map(field => ({ name: field.name, scalar: getScalar(field, { required: false }) })) || [],
            ...uniqueComposites?.map(field => ({ name: field.name, scalar: field.scalar })),
        ]

        const extendedWhereUniqueInputFields = uniqBy([
            ...whereUniqueInputFields,
            ...whereInputFields,
        ], 'name')

        const scalarWhereInputFields = fields
            ?.map((field) => {
                let scalar

                if (!field?.relationName) {
                    if (field.isList) {
                        if (field.kind === 'enum')
                            scalar = getScalar(field, { after: 'EnumListFilter', required: false, list: false })
                        else
                            scalar = getScalar(field, { after: 'ListFilter', required: false, list: false })
                    }
                    else {
                        if (field.kind === 'enum')
                            scalar = getScalar(field, { after: 'EnumFilter', required: false })
                        else
                            scalar = getScalar(field, { after: `${!field.isRequired ? 'Nullable' : ''}Filter`, required: false })
                    }
                }

                return { name: field.name, scalar }
            })
            ?.filter(field => field.scalar) || []

        return {
            singular: modelDMMF.name,
            plural: plural(modelDMMF.name),
            fields,
            directives,
            gqlFields: {
                operations: operationsFields,
                whereInput: whereInputFields,
                whereUniqueInput: whereUniqueInputFields,
                extendedWhereUniqueInput: extendedWhereUniqueInputFields,
                scalarWhereInput: scalarWhereInputFields,
                uniqueComposites,
            },
            getScalar,
            documentation: modelDMMF.documentation || '',
            defaultDirective: options?.defaultDirective || '',
        }
    }

    private createBaseTypes() {
        this.types.push({
            name: 'BatchPayload',
            fields: [
                { name: 'count', scalar: 'Int!' },
            ],
        })
    }

    private createBaseInputs() {
        this.inputs.push({
            name: 'IntOperation',
            fields: [
                { name: 'set', scalar: 'Int' },
                { name: 'increment', scalar: 'Int' },
                { name: 'decrement', scalar: 'Int' },
                { name: 'multiply', scalar: 'Int' },
                { name: 'divide', scalar: 'Int' },
            ],
        })

        this.inputs.push({
            name: 'FloatOperation',
            fields: [
                { name: 'set', scalar: 'Float' },
                { name: 'increment', scalar: 'Float' },
                { name: 'decrement', scalar: 'Float' },
                { name: 'multiply', scalar: 'Float' },
                { name: 'divide', scalar: 'Float' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateTimeFilter',
            fields: [
                { name: 'equals', scalar: 'AWSDateTime' },
                { name: 'gt', scalar: 'AWSDateTime' },
                { name: 'gte', scalar: 'AWSDateTime' },
                { name: 'in', scalar: '[AWSDateTime!]' },
                { name: 'lt', scalar: 'AWSDateTime' },
                { name: 'lte', scalar: 'AWSDateTime' },
                { name: 'not', scalar: 'AWSDateTimeFilter' },
                { name: 'notIn', scalar: '[AWSDateTime!]' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateTimeNullableFilter',
            fields: [
                { name: 'equals', scalar: 'AWSDateTime' },
                { name: 'gt', scalar: 'AWSDateTime' },
                { name: 'gte', scalar: 'AWSDateTime' },
                { name: 'in', scalar: '[AWSDateTime!]' },
                { name: 'lt', scalar: 'AWSDateTime' },
                { name: 'lte', scalar: 'AWSDateTime' },
                { name: 'not', scalar: 'AWSDateTimeFilter' },
                { name: 'notIn', scalar: '[AWSDateTime!]' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateTimeListFilter',
            fields: [
                { name: 'equals', scalar: '[AWSDateTime!]' },
                { name: 'has', scalar: 'AWSDateTime' },
                { name: 'hasEvery', scalar: '[AWSDateTime!]' },
                { name: 'hasSome', scalar: '[AWSDateTime!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateFilter',
            fields: [
                { name: 'equals', scalar: 'AWSDate' },
                { name: 'gt', scalar: 'AWSDate' },
                { name: 'gte', scalar: 'AWSDate' },
                { name: 'in', scalar: '[AWSDate!]' },
                { name: 'lt', scalar: 'AWSDate' },
                { name: 'lte', scalar: 'AWSDate' },
                { name: 'not', scalar: 'AWSDateFilter' },
                { name: 'notIn', scalar: '[AWSDate!]' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateNullableFilter',
            fields: [
                { name: 'equals', scalar: 'AWSDate' },
                { name: 'gt', scalar: 'AWSDate' },
                { name: 'gte', scalar: 'AWSDate' },
                { name: 'in', scalar: '[AWSDate!]' },
                { name: 'lt', scalar: 'AWSDate' },
                { name: 'lte', scalar: 'AWSDate' },
                { name: 'not', scalar: 'AWSDateFilter' },
                { name: 'notIn', scalar: '[AWSDate!]' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSDateListFilter',
            fields: [
                { name: 'equals', scalar: '[AWSDate!]' },
                { name: 'has', scalar: 'AWSDate' },
                { name: 'hasEvery', scalar: '[AWSDate!]' },
                { name: 'hasSome', scalar: '[AWSDate!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'FloatFilter',
            fields: [
                { name: 'equals', scalar: 'Float' },
                { name: 'gt', scalar: 'Float' },
                { name: 'gte', scalar: 'Float' },
                { name: 'in', scalar: '[Float!]' },
                { name: 'lt', scalar: 'Float' },
                { name: 'lte', scalar: 'Float' },
                { name: 'not', scalar: 'FloatFilter' },
                { name: 'notIn', scalar: '[Float!]' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'FloatNullableFilter',
            fields: [
                { name: 'equals', scalar: 'Float' },
                { name: 'gt', scalar: 'Float' },
                { name: 'gte', scalar: 'Float' },
                { name: 'in', scalar: '[Float!]' },
                { name: 'lt', scalar: 'Float' },
                { name: 'lte', scalar: 'Float' },
                { name: 'not', scalar: 'FloatFilter' },
                { name: 'notIn', scalar: '[Float!]' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'FloatListFilter',
            fields: [
                { name: 'equals', scalar: '[Float!]' },
                { name: 'has', scalar: 'Float' },
                { name: 'hasEvery', scalar: '[Float!]' },
                { name: 'hasSome', scalar: '[Float!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'IntFilter',
            fields: [
                { name: 'equals', scalar: 'Int' },
                { name: 'gt', scalar: 'Int' },
                { name: 'gte', scalar: 'Int' },
                { name: 'in', scalar: '[Int!]' },
                { name: 'lt', scalar: 'Int' },
                { name: 'lte', scalar: 'Int' },
                { name: 'not', scalar: 'IntFilter' },
                { name: 'notIn', scalar: '[Int!]' },
            ],
        })

        this.inputs.push({
            name: 'IntNullableFilter',
            fields: [
                { name: 'equals', scalar: 'Int' },
                { name: 'gt', scalar: 'Int' },
                { name: 'gte', scalar: 'Int' },
                { name: 'in', scalar: '[Int!]' },
                { name: 'lt', scalar: 'Int' },
                { name: 'lte', scalar: 'Int' },
                { name: 'not', scalar: 'IntFilter' },
                { name: 'notIn', scalar: '[Int!]' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'IntListFilter',
            fields: [
                { name: 'equals', scalar: '[Int!]' },
                { name: 'has', scalar: 'Int' },
                { name: 'hasEvery', scalar: '[Int!]' },
                { name: 'hasSome', scalar: '[Int!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSJSONFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSJSON' },
                { name: 'in', scalar: '[AWSJSON!]' },
                { name: 'not', scalar: 'AWSJSONFilter' },
                { name: 'notIn', scalar: '[AWSJSON!]' },
                { name: 'startsWith', scalar: 'String' },
            ],
        })

        this.inputs.push({
            name: 'AWSJSONNullableFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSJSON' },
                { name: 'in', scalar: '[AWSJSON!]' },
                { name: 'not', scalar: 'AWSJSONFilter' },
                { name: 'notIn', scalar: '[AWSJSON!]' },
                { name: 'startsWith', scalar: 'String' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSJSONListFilter',
            fields: [
                { name: 'equals', scalar: '[AWSJSON!]' },
                { name: 'has', scalar: 'AWSJSON' },
                { name: 'hasEvery', scalar: '[AWSJSON!]' },
                { name: 'hasSome', scalar: '[AWSJSON!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSEmailFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSEmail' },
                { name: 'in', scalar: '[AWSEmail!]' },
                { name: 'not', scalar: 'AWSEmailFilter' },
                { name: 'notIn', scalar: '[AWSEmail!]' },
                { name: 'startsWith', scalar: 'String' },
            ],
        })

        this.inputs.push({
            name: 'AWSEmailNullableFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSEmail' },
                { name: 'in', scalar: '[AWSEmail!]' },
                { name: 'not', scalar: 'AWSEmailFilter' },
                { name: 'notIn', scalar: '[AWSEmail!]' },
                { name: 'startsWith', scalar: 'String' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSEmailListFilter',
            fields: [
                { name: 'equals', scalar: '[AWSEmail!]' },
                { name: 'has', scalar: 'AWSEmail' },
                { name: 'hasEvery', scalar: '[AWSEmail!]' },
                { name: 'hasSome', scalar: '[AWSEmail!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSURLFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSURL' },
                { name: 'in', scalar: '[AWSURL!]' },
                { name: 'not', scalar: 'AWSURLFilter' },
                { name: 'notIn', scalar: '[AWSURL!]' },
                { name: 'startsWith', scalar: 'String' },
            ],
        })

        this.inputs.push({
            name: 'AWSURLNullableFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'AWSURL' },
                { name: 'in', scalar: '[AWSURL!]' },
                { name: 'not', scalar: 'AWSURLFilter' },
                { name: 'notIn', scalar: '[AWSURL!]' },
                { name: 'startsWith', scalar: 'String' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'AWSURLListFilter',
            fields: [
                { name: 'equals', scalar: '[AWSURL!]' },
                { name: 'has', scalar: 'AWSURL' },
                { name: 'hasEvery', scalar: '[AWSURL!]' },
                { name: 'hasSome', scalar: '[AWSURL!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'StringFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'String' },
                { name: 'in', scalar: '[String!]' },
                { name: 'not', scalar: 'StringFilter' },
                { name: 'notIn', scalar: '[String!]' },
                { name: 'startsWith', scalar: 'String' },
                { name: 'mode', scalar: 'String' },
            ],
        })

        this.inputs.push({
            name: 'StringNullableFilter',
            fields: [
                { name: 'contains', scalar: 'String' },
                { name: 'endsWith', scalar: 'String' },
                { name: 'equals', scalar: 'String' },
                { name: 'in', scalar: '[String!]' },
                { name: 'not', scalar: 'StringFilter' },
                { name: 'notIn', scalar: '[String!]' },
                { name: 'startsWith', scalar: 'String' },
                { name: 'mode', scalar: 'String' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'StringListFilter',
            fields: [
                { name: 'equals', scalar: '[String!]' },
                { name: 'has', scalar: 'String' },
                { name: 'hasEvery', scalar: '[String!]' },
                { name: 'hasSome', scalar: '[String!]' },
                { name: 'isEmpty', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'BooleanFilter',
            fields: [
                { name: 'equals', scalar: 'Boolean' },
                { name: 'not', scalar: 'BooleanFilter' },
            ],
        })

        this.inputs.push({
            name: 'BooleanNullableFilter',
            fields: [
                { name: 'equals', scalar: 'Boolean' },
                { name: 'not', scalar: 'BooleanFilter' },
                { name: 'isNull', scalar: 'Boolean' },
            ],
        })

        this.inputs.push({
            name: 'BooleanListFilter',
            fields: [
                { name: 'equals', scalar: '[Boolean!]' },
                { name: 'has', scalar: 'Boolean' },
                { name: 'hasEvery', scalar: '[Boolean!]' },
                { name: 'hasSome', scalar: '[Boolean!]' },
            ],
        })
    }

    private createBaseEnums() {
        this.enums.push({
            name: 'OrderByArg',
            options: ['ASC', 'DESC'],
        })

        this.enums.push({
            name: 'NullArg',
            options: ['NULL'],
        })
    }

    private createEnumsInputs(datamodel: DMMF.Datamodel) {
        datamodel?.enums.forEach((thisEnum: DMMF.DatamodelEnum) => {
            this.inputs.push({
                name: `${thisEnum.name}EnumFilter`,
                fields: [
                    { name: 'equals', scalar: thisEnum.name },
                    { name: 'in', scalar: `[${thisEnum.name}!]` },
                    { name: 'not', scalar: `${thisEnum.name}EnumFilter` },
                    { name: 'notIn', scalar: `[${thisEnum.name}!]` },
                ],
            })

            this.inputs.push({
                name: `${thisEnum.name}EnumListFilter`,
                fields: [
                    { name: 'equals', scalar: `[${thisEnum.name}!]` },
                    { name: 'has', scalar: thisEnum.name },
                    { name: 'hasEvery', scalar: `[${thisEnum.name}!]` },
                    { name: 'hasSome', scalar: `[${thisEnum.name}!]` },
                    { name: 'isEmpty', scalar: 'Boolean' },
                ],
            })
        })
    }

    private createEnumsTypes(datamodel: DMMF.Datamodel) {
        datamodel?.enums.forEach((thisEnum: DMMF.DatamodelEnum) => {
            this.enums.push({
                name: thisEnum.name,
                options: thisEnum.values.map(e => e.name),
            })
        })
    }

    private createModelTypes(model: ParsedModel) {
        this.types.push({
            name: model.singular,
            fields: model.fields.map((field) => {
                return {
                    name: field.name,
                    scalar: model.getScalar(field, { required: field.isRequired }),
                    directives: model?.directives?.getGQLDirectivesForField(field.name),
                }
            }),
            directives: model?.directives?.getGQLDirectivesForModel(),
        })
    }

    private createModelInputs(model: ParsedModel, allModels: ParsedModel[]) {
        model.gqlFields?.uniqueComposites?.forEach((uniqueComposite) => {
            this.inputs.push({
                name: uniqueComposite.scalar,
                fields: uniqueComposite.fields,
            })
        })

        this.inputs.push({
            name: `${model.singular}Filter`,
            fields: [
                { name: 'some', scalar: `${model.singular}WhereInputWithoutNullables` },
                { name: 'every', scalar: `${model.singular}WhereInputWithoutNullables` },
                { name: 'none', scalar: `${model.singular}WhereInputWithoutNullables` },
            ],
        })

        this.inputs.push({
            name: `${model.singular}WhereInputWithoutNullables`,
            fields: [
                { name: 'OR', scalar: `[${model.singular}WhereInput!]` },
                { name: 'NOT', scalar: `[${model.singular}WhereInput!]` },
                { name: 'AND', scalar: `[${model.singular}WhereInput!]` },
                ...model.gqlFields.whereInput,
            ],
        })

        this.inputs.push({
            name: `${model.singular}WhereInput`,
            fields: [
                { name: 'is', scalar: 'NullArg' },
                { name: 'isNot', scalar: 'NullArg' },
                { name: 'OR', scalar: `[${model.singular}WhereInput!]` },
                { name: 'NOT', scalar: `[${model.singular}WhereInput!]` },
                { name: 'AND', scalar: `[${model.singular}WhereInput!]` },
                ...model.gqlFields.whereInput,
            ],
        })

        this.inputs.push({
            name: `${model.singular}ScalarWhereInput`,
            fields: [
                { name: 'OR', scalar: `[${model.singular}ScalarWhereInput!]` },
                { name: 'NOT', scalar: `[${model.singular}ScalarWhereInput!]` },
                { name: 'AND', scalar: `[${model.singular}ScalarWhereInput!]` },
                ...model.gqlFields.scalarWhereInput,
            ],
        })

        if (model.gqlFields.whereUniqueInput?.length) {
            this.inputs.push({
                name: `${model.singular}WhereUniqueInput`,
                fields: model.gqlFields.whereUniqueInput,
            })
        }

        if (model.gqlFields.extendedWhereUniqueInput?.length) {
            this.inputs.push({
                name: `${model.singular}ExtendedWhereUniqueInput`,
                fields: [
                    { name: 'OR', scalar: `[${model.singular}WhereInput!]` },
                    { name: 'NOT', scalar: `[${model.singular}WhereInput!]` },
                    { name: 'AND', scalar: `[${model.singular}WhereInput!]` },
                    ...model.gqlFields.extendedWhereUniqueInput,
                ],
            })
        }

        this.inputs.push({
            name: `${model.singular}OrderByInput`,
            fields: model.fields
                ?.map((field) => {
                    if (field?.relationName)
                        return { name: field.name, scalar: model.getScalar(field, { after: 'OrderByInput', required: false, list: false }) }
                    else
                        return { name: field.name, scalar: 'OrderByArg' }
                }) || [],
        })

        const nestedCreateInputs = uniqBy(
            model.fields
                ?.filter(field => !field?.isReadOnly && field?.relationName)
                ?.map((field) => {
                    const name = `${model.singular}${upperFirst(field.name)}CreateNestedInput`
                    const refModel = allModels.find(m => m.singular === field.type)
                    const fields: GqlField[] = []

                    if (field.isList) {
                        fields.push({ name: 'connect', scalar: `[${field.type}WhereUniqueInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('create')) {
                            fields.push({ name: 'create', scalar: `[${field.type}CreateInput!]` })
                            fields.push({ name: 'connectOrCreate', scalar: `[${field.type}ConnectOrCreateInput!]` })
                        }
                    }
                    else {
                        fields.push({ name: 'connect', scalar: `${field.type}WhereUniqueInput` })

                        if (refModel?.directives.isActionEligibleForGQL('create')) {
                            fields.push({ name: 'create', scalar: `${field.type}CreateInput` })
                            fields.push({ name: 'connectOrCreate', scalar: `${field.type}ConnectOrCreateInput` })
                        }
                    }

                    return {
                        name,
                        fields,
                    }
                }) || []
            , 'name')

        nestedCreateInputs.forEach((nestedCreateInput) => {
            this.inputs.push(nestedCreateInput)
        })

        const nestedUpdateInputs = uniqBy(
            model.fields
                ?.filter(field => !field?.isReadOnly && field?.relationName)
                ?.map((field) => {
                    const name = `${model.singular}${upperFirst(field.name)}UpdateNestedInput`
                    const refModel = allModels.find(m => m.singular === field.type)
                    const fields: GqlField[] = []

                    if (field.isList) {
                        fields.push({ name: 'connect', scalar: `[${field.type}WhereUniqueInput!]` })
                        fields.push({ name: 'disconnect', scalar: `[${field.type}ExtendedWhereUniqueInput!]` })
                        fields.push({ name: 'set', scalar: `[${field.type}WhereUniqueInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('create')) {
                            fields.push({ name: 'create', scalar: `[${field.type}CreateInput!]` })
                            fields.push({ name: 'connectOrCreate', scalar: `[${field.type}ConnectOrCreateInput!]` })
                        }

                        if (refModel?.directives.isActionEligibleForGQL('update'))
                            fields.push({ name: 'update', scalar: `[${field.type}UpdateUniqueInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('upsert'))
                            fields.push({ name: 'upsert', scalar: `[${field.type}UpsertUniqueInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('delete'))
                            fields.push({ name: 'delete', scalar: `[${field.type}ExtendedWhereUniqueInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('deleteMany'))
                            fields.push({ name: 'deleteMany', scalar: `[${field.type}ScalarWhereInput!]` })

                        if (refModel?.directives.isActionEligibleForGQL('updateMany'))
                            fields.push({ name: 'updateMany', scalar: `[${field.type}UpdateManyInput!]` })
                    }
                    else {
                        fields.push({ name: 'connect', scalar: `${field.type}WhereUniqueInput` })
                        fields.push({ name: 'disconnect', scalar: 'Boolean' })

                        if (refModel?.directives.isActionEligibleForGQL('create')) {
                            fields.push({ name: 'create', scalar: `${field.type}CreateInput` })
                            fields.push({ name: 'connectOrCreate', scalar: `${field.type}ConnectOrCreateInput` })
                        }

                        if (refModel?.directives.isActionEligibleForGQL('update'))
                            fields.push({ name: 'update', scalar: `${field.type}UpdateInput` })

                        if (refModel?.directives.isActionEligibleForGQL('upsert'))
                            fields.push({ name: 'upsert', scalar: `${field.type}UpsertInput` })

                        if (refModel?.directives.isActionEligibleForGQL('delete'))
                            fields.push({ name: 'delete', scalar: 'Boolean' })
                    }

                    return {
                        name,
                        fields,
                    }
                }) || []
            , 'name')

        nestedUpdateInputs.forEach((nestedUpdateInput) => {
            this.inputs.push(nestedUpdateInput)
        })

        if (model?.directives.isActionEligibleForGQL('create')) {
            this.inputs.push({
                name: `${model.singular}CreateInput`,
                fields: model.fields
                    ?.filter(field => !field?.isReadOnly)
                    ?.map((field) => {
                        if (field?.relationName) {
                            const scalar = `${model.singular}${upperFirst(field.name)}CreateNestedInput`

                            return {
                                name: field.name,
                                scalar: model.getScalar(field, { scalar, required: false, list: false }),
                            }
                        }
                        else {
                            return {
                                name: field.name,
                                scalar: model.getScalar(field),
                                defaultValue: field.default,
                            }
                        }
                    }) || [],
            })
        }

        if (model?.directives.isActionEligibleForGQL('createMany')) {
            this.inputs.push({
                name: `${model.singular}CreateManyInput`,
                fields: model.fields
                    ?.filter(field => !field?.relationName && !field?.isReadOnly)
                    ?.map(field => ({
                        name: field.name,
                        scalar: model.getScalar(field),
                        defaultValue: field.default,
                    })) || [],
            })
        }

        if (model?.directives.isActionEligibleForGQL('update')) {
            this.inputs.push({
                name: `${model.singular}UpdateInput`,
                fields: model.fields
                    ?.filter(field => !field?.isReadOnly)
                    ?.map((field) => {
                        if (field?.relationName) {
                            const scalar = `${model.singular}${upperFirst(field.name)}UpdateNestedInput`

                            return {
                                name: field.name,
                                scalar: model.getScalar(field, { scalar, required: false, list: false }),
                            }
                        }
                        else {
                            return { name: field.name, scalar: model.getScalar(field, { required: false }) }
                        }
                    }) || [],
            })

            if (model.gqlFields?.operations?.length) {
                this.inputs.push({
                    name: `${model.singular}OperationInput`,
                    fields: model.gqlFields.operations,
                })
            }

            this.inputs.push({
                name: `${model.singular}UpdateUniqueInput`,
                fields: [
                    { name: 'data', scalar: `${model.singular}UpdateInput!` },
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                ],
            })
        }

        if (model?.directives.isActionEligibleForGQL('updateMany')) {
            this.inputs.push({
                name: `${model.singular}UpdateManyInput`,
                fields: [
                    { name: 'where', scalar: `${model.singular}ScalarWhereInput!` },
                    { name: 'data', scalar: `${model.singular}UpdateInput!` },
                ],
            })
        }

        if (model?.directives.isActionEligibleForGQL('upsert')) {
            this.inputs.push({
                name: `${model.singular}UpsertInput`,
                fields: [
                    { name: 'create', scalar: `${model.singular}CreateInput!` },
                    { name: 'update', scalar: `${model.singular}UpdateInput!` },
                ],
            })

            this.inputs.push({
                name: `${model.singular}UpsertUniqueInput`,
                fields: [
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                    { name: 'create', scalar: `${model.singular}CreateInput!` },
                    { name: 'update', scalar: `${model.singular}UpdateInput!` },
                ],
            })
        }

        if (model?.directives.isActionEligibleForGQL('create')) {
            this.inputs.push({
                name: `${model.singular}ConnectOrCreateInput`,
                fields: [
                    { name: 'where', scalar: `${model.singular}WhereUniqueInput!` },
                    { name: 'create', scalar: `${model.singular}CreateInput!` },
                ],
            })
        }
    }

    private createModelQueries(model: ParsedModel) {
        // get
        if (model?.directives.isActionEligibleForGQL('get')) {
            this.queries.push({
                name: `get${model.singular}`,
                comment: `Retrieve a single ${model.singular} record by unique identifier.`,
                args: [
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                ],
                scalar: `${model.singular}`,
                directives: model?.directives?.getGQLDirectivesForAction('get'),
            })
        }

        // list
        if (model?.directives.isActionEligibleForGQL('list')) {
            this.queries.push({
                name: `list${model.plural}`,
                comment: `Retrieve a list of ${model.plural} records.`,
                args: [
                    { name: 'where', scalar: `${model.singular}WhereInput` },
                    { name: 'orderBy', scalar: `[${model.singular}OrderByInput!]` },
                    { name: 'skip', scalar: 'Int' },
                    { name: 'take', scalar: 'Int' },
                ],
                scalar: `[${model.singular}!]`,
                directives: model?.directives?.getGQLDirectivesForAction('list'),
            })
        }

        // count
        if (model?.directives.isActionEligibleForGQL('count')) {
            this.queries.push({
                name: `count${model.plural}`,
                comment: `Count the number of ${model.plural} records.`,
                args: [
                    { name: 'where', scalar: `${model.singular}WhereInput` },
                    { name: 'orderBy', scalar: `[${model.singular}OrderByInput!]` },
                    { name: 'skip', scalar: 'Int' },
                    { name: 'take', scalar: 'Int' },
                ],
                scalar: 'Int!',
                directives: model?.directives?.getGQLDirectivesForAction('count'),
            })
        }
    }

    private createModelMutations(model: ParsedModel) {
        // create
        if (model?.directives.isActionEligibleForGQL('create')) {
            this.mutations.push({
                name: `create${model.singular}`,
                comment: `Create a new ${model.singular} record.`,
                args: [
                    { name: 'data', scalar: `${model.singular}CreateInput!` },
                ],
                scalar: `${model.singular}!`,
                directives: model?.directives?.getGQLDirectivesForAction('create'),
            })
        }

        // createMany
        if (model?.directives.isActionEligibleForGQL('createMany')) {
            this.mutations.push({
                name: `createMany${model.plural}`,
                comment: `Create multiple new ${model.plural} records.`,
                args: [
                    { name: 'data', scalar: `[${model.singular}CreateManyInput!]` },
                    { name: 'skipDuplicates', scalar: 'Boolean' },
                ],
                scalar: 'BatchPayload!',
                directives: model?.directives?.getGQLDirectivesForAction('createMany'),
            })
        }

        // update
        if (model?.directives.isActionEligibleForGQL('update')) {
            this.mutations.push({
                name: `update${model.singular}`,
                comment: `Update a single existing ${model.singular} record.`,
                args: [
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                    { name: 'data', scalar: `${model.singular}UpdateInput` },
                    ...model.gqlFields?.operations?.length ? [{ name: 'operation', scalar: `${model.singular}OperationInput` }] : [],
                ],
                scalar: `${model.singular}!`,
                directives: model?.directives?.getGQLDirectivesForAction('update'),
            })
        }

        // updateMany
        if (model?.directives.isActionEligibleForGQL('updateMany')) {
            this.mutations.push({
                name: `updateMany${model.plural}`,
                comment: `Update multiple existing ${model.plural} records.`,
                args: [
                    { name: 'where', scalar: `${model.singular}WhereInput!` },
                    { name: 'data', scalar: `${model.singular}UpdateInput` },
                    ...model.gqlFields?.operations?.length ? [{ name: 'operation', scalar: `${model.singular}OperationInput` }] : [],
                ],
                scalar: 'BatchPayload!',
                directives: model?.directives?.getGQLDirectivesForAction('updateMany'),
            })
        }

        // upsert
        if (model?.directives.isActionEligibleForGQL('upsert')) {
            this.mutations.push({
                name: `upsert${model.singular}`,
                comment: `Create a new ${model.singular} record if it does not exist, or updates it if it does.`,
                args: [
                    { name: 'create', scalar: `${model.singular}CreateInput!` },
                    { name: 'update', scalar: `${model.singular}UpdateInput!` },
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                ],
                scalar: `${model.singular}!`,
                directives: model?.directives?.getGQLDirectivesForAction('upsert'),
            })
        }

        // delete
        if (model?.directives.isActionEligibleForGQL('delete')) {
            this.mutations.push({
                name: `delete${model.singular}`,
                comment: `Delete a single existing ${model.singular} record.`,
                args: [
                    { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                ],
                scalar: `${model.singular}!`,
                directives: model?.directives?.getGQLDirectivesForAction('delete'),
            })
        }

        // deleteMany
        if (model?.directives.isActionEligibleForGQL('deleteMany')) {
            this.mutations.push({
                name: `deleteMany${model.plural}`,
                comment: `Delete multiple existing ${model.plural} records.`,
                args: [
                    { name: 'where', scalar: `${model.singular}WhereInput!` },
                ],
                scalar: 'BatchPayload!',
                directives: model?.directives?.getGQLDirectivesForAction('deleteMany'),
            })
        }
    }

    private createModelSubscriptions(model: ParsedModel) {
        // onCreated
        if (model?.directives.isActionEligibleForGQL('onCreated')) {
            this.subscriptions.push({
                name: `onCreated${model.singular}`,
                comment: `Event triggered when a new ${model.singular} record is created.`,
                args: model.gqlFields.whereUniqueInput.slice(0, 8),
                scalar: `${model.singular}!`,
                directives: [`@aws_subscribe(mutations: ["create${model.singular}"])`, ...model?.directives?.getGQLDirectivesForAction('onCreated')],
            })
        }

        // onUpdated
        if (model?.directives.isActionEligibleForGQL('onUpdated')) {
            this.subscriptions.push({
                name: `onUpdated${model.singular}`,
                comment: `Event triggered when an existing ${model.singular} record is updated.`,
                args: model.gqlFields.whereUniqueInput.slice(0, 8),
                scalar: `${model.singular}!`,
                directives: [`@aws_subscribe(mutations: ["update${model.singular}"])`, ...model?.directives?.getGQLDirectivesForAction('onUpdated')],
            })
        }

        // onUpserted
        if (model?.directives.isActionEligibleForGQL('onUpserted')) {
            this.subscriptions.push({
                name: `onUpserted${model.singular}`,
                comment: `Event triggered when a ${model.singular} record is either created or updated.`,
                args: model.gqlFields.whereUniqueInput.slice(0, 8),
                scalar: `${model.singular}!`,
                directives: [`@aws_subscribe(mutations: ["upsert${model.singular}"])`, ...model?.directives?.getGQLDirectivesForAction('onUpserted')],
            })
        }

        // onDeleted
        if (model?.directives.isActionEligibleForGQL('onDeleted')) {
            this.subscriptions.push({
                name: `onDeleted${model.singular}`,
                comment: `Event triggered when an existing ${model.singular} record is deleted.`,
                args: model.gqlFields.whereUniqueInput.slice(0, 8),
                scalar: `${model.singular}!`,
                directives: [`@aws_subscribe(mutations: ["delete${model.singular}"])`, ...model?.directives?.getGQLDirectivesForAction('onDeleted')],
            })
        }

        // onMutated
        if (model?.directives.isActionEligibleForGQL('onMutated')) {
            this.subscriptions.push({
                name: `onMutated${model.singular}`,
                comment: `Event triggered when a ${model.singular} record is either created, updated, or deleted.`,
                args: model.gqlFields.whereUniqueInput.slice(0, 8),
                scalar: `${model.singular}!`,
                directives: [`@aws_subscribe(mutations: ["create${model.singular}", "update${model.singular}", "upsert${model.singular}", "delete${model.singular}"])`, ...model?.directives?.getGQLDirectivesForAction('onMutated')],
            })
        }

        // onCreatedMany
        if (model?.directives.isActionEligibleForGQL('onCreatedMany')) {
            this.subscriptions.push({
                name: `onCreatedMany${model.plural}`,
                comment: `Event triggered when multiple new ${model.plural} records are created.`,
                args: [],
                scalar: 'BatchPayload!',
                directives: [`@aws_subscribe(mutations: ["createMany${model.plural}"])`, ...model?.directives?.getGQLDirectivesForAction('onCreatedMany')],
            })
        }

        // onUpdatedMany
        if (model?.directives.isActionEligibleForGQL('onUpdatedMany')) {
            this.subscriptions.push({
                name: `onUpdatedMany${model.plural}`,
                comment: `Event triggered when multiple existing ${model.plural} records are updated.`,
                args: [],
                scalar: 'BatchPayload!',
                directives: [`@aws_subscribe(mutations: ["updateMany${model.plural}"])`, ...model?.directives?.getGQLDirectivesForAction('onUpdatedMany')],
            })
        }

        // onDeletedMany
        if (model?.directives.isActionEligibleForGQL('onDeletedMany')) {
            this.subscriptions.push({
                name: `onDeletedMany${model.plural}`,
                comment: `Event triggered when multiple existing ${model.plural} records are deleted.`,
                args: [],
                scalar: 'BatchPayload!',
                directives: [`@aws_subscribe(mutations: ["deleteMany${model.plural}"])`, ...model?.directives?.getGQLDirectivesForAction('onDeletedMany')],
            })
        }

        // onMutatedMany
        if (model?.directives.isActionEligibleForGQL('onMutatedMany')) {
            this.subscriptions.push({
                name: `onMutatedMany${model.plural}`,
                comment: `Event triggered when multiple ${model.plural} records are either created, updated, or deleted.`,
                args: [],
                scalar: 'BatchPayload!',
                directives: [`@aws_subscribe(mutations: ["createMany${model.plural}", "updateMany${model.plural}", "deleteMany${model.plural}"])`, ...model?.directives?.getGQLDirectivesForAction('onMutatedMany')],
            })
        }
    }

    private getFieldScalar(field: DMMF.Field, inject?: FieldScalarOptions) {
        const isRequired = typeof inject?.required !== 'undefined'
            ? inject.required
            : (field.isRequired && !field.hasDefaultValue && !field.isUpdatedAt)
        const isList = typeof inject?.list !== 'undefined'
            ? inject.list
            : field.isList

        let type = 'String'

        if (field.kind === 'scalar' && typeof field.type === 'string') {
            const lowerType = field.type.toLocaleLowerCase()

            if (lowerType === 'int')
                type = 'Int'
            else if (lowerType === 'datetime')
                type = 'AWSDateTime'
            else if (lowerType === 'date')
                type = 'AWSDate'
            else if (lowerType === 'json')
                type = 'AWSJSON'
            else if (lowerType === 'float')
                type = 'Float'
            else if (lowerType === 'boolean')
                type = 'Boolean'
            else if (lowerType === 'string')
                type = 'String'

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

        else if (field.kind === 'enum') {
            type = field.type
        }

        else if (typeof field.type === 'string') {
            type = pascalCase(field.type)
        }

        if (
            inject?.scalar
            && ['Int', 'AWSDateTime', 'AWSURL', 'AWSEmail', 'AWSDate', 'AWSJSON', 'Float', 'Boolean', 'String'].includes(inject.scalar)
        )
            type = [inject?.before || '', inject.scalar, inject?.after || ''].filter(Boolean).join('')

        else if (inject?.scalar)
            type = inject.scalar

        else
            type = [inject?.before || '', type, inject?.after || ''].filter(Boolean).join('')

        const scalar = [
            isList ? '[' : '',
            type,
            isList ? '!' : '',
            isList ? ']' : '',
            isRequired ? '!' : '',
        ].filter(Boolean).join('')

        return scalar
    }

    private async buildAppSyncSchema() {
        const types = [
            this.types.map((t) => {
                return [
                    `type ${t.name}${t?.directives?.length ? ` ${t.directives.join(' ')}` : ''} {`,
                    t.fields.map((f) => {
                        const d = f?.directives ? ` ${f?.directives?.join(' ')}` : ''
                        return `${f.name}: ${f.scalar}${d}`
                    }).join('\n'),
                    '}',
                ].join('\n')
            }).join('\n\n'),
        ].join('\n')

        const enums = [
            this.enums.map((e) => {
                return [
                    `enum ${e.name} {`,
                    e.options.join('\n'),
                    '}',
                ].join('\n')
            }).join('\n\n'),
        ].join('\n')

        const inputs = [
            this.inputs.map((i) => {
                return [
                    `input ${i.name} {`,
                    i.fields.map((f) => {
                        const defaultValue = ['boolean', 'string', 'number'].includes(typeof f.defaultValue)
                            ? ` = ${f.defaultValue}`
                            : ''
                        return `${f.name}: ${f.scalar}${defaultValue}`
                    }).join('\n'),
                    '}',
                ].join('\n')
            }).join('\n\n'),
        ].join('\n')

        const queries = this.queries?.length
            ? [
                    'type Query {',
                    this.queries.map((q) => {
                        const args = q.args.map(arg => `${arg.name}: ${arg.scalar}`)
                        return [
                            q?.comment ? `"""\n${q.comment}\n"""` : '',
                            [
                                q.name,
                                args?.length ? `(\n${args.join(',\n')}\n)` : '',
                        `: ${q.scalar}`,
                        q?.directives?.join(' '),
                            ].filter(Boolean).join(''),
                        ].filter(Boolean).join('\n')
                    }).join('\n\n'),
                    '}',
                ].join('\n')
            : ''

        const mutations = this.mutations?.length
            ? [
                    'type Mutation {',
                    this.mutations.map((m) => {
                        const args = m.args.map(arg => `${arg.name}: ${arg.scalar}`)
                        return [
                            m?.comment ? `"""\n${m.comment}\n"""` : '',
                            [
                                m.name,
                                args?.length ? `(\n${args.join(',\n')}\n)` : '',
                        `: ${m.scalar}`,
                        m?.directives?.join(' '),
                            ].filter(Boolean).join(''),
                        ].filter(Boolean).join('\n')
                    }).join('\n\n'),
                    '}',
                ].join('\n')
            : ''

        const subscriptions = this.subscriptions?.length
            ? [
                    'type Subscription {',
                    this.subscriptions.map((s) => {
                        const args = s.args.map(arg => `${arg.name}: ${arg.scalar}`)
                        return [
                            s?.comment ? `"""\n${s.comment}\n"""` : '',
                            [
                                s.name,
                                args?.length ? `(\n${args.join(',\n')}\n)` : '',
                        `: ${s.scalar}`,
                        s.directives.join(' '),
                            ].filter(Boolean).join(''),
                        ].filter(Boolean).join('\n')
                    }).join('\n\n'),
                    '}',
                ].join('\n')
            : ''

        const doc = [
            types,
            enums,
            inputs,
            queries,
            mutations,
            subscriptions,
        ].join('\n\n')

        return this.perttyGraphQL(doc)
    }
}

type ParsedModel = {
    singular: string
    plural: string
    fields: DMMF.Field[]
    gqlFields: {
        operations: GqlField[]
        whereInput: GqlField[]
        whereUniqueInput: GqlField[]
        extendedWhereUniqueInput: GqlField[]
        scalarWhereInput: GqlField[]
        uniqueComposites: {
            name: string
            scalar: string
            fields: GqlField[]
        }[]
    }
    directives: ModelDirectives
    getScalar: (field: DMMF.Field, inject?: FieldScalarOptions) => string
    documentation: string
    defaultDirective: string
}

type GqlField = {
    name: string
    scalar: string
    defaultValue?: any
    directives?: string[]
}

type GqlArg = {
    name: string
    scalar: string
}

type GqlType = {
    name: string
    comment?: string
    fields: GqlField[]
    directives?: string[]
}

type GqlInput = {
    name: string
    comment?: string
    fields: GqlField[]
}

type GqlEnum = {
    name: string
    comment?: string
    options: string[]
}

type GqlQuery = {
    name: string
    comment?: string
    args: GqlArg[]
    scalar: string
    directives?: string[]
}

type GqlMutation = {
    name: string
    comment?: string
    args: GqlArg[]
    scalar: string
    directives?: string[]
}

type GqlSubscription = {
    name: string
    comment?: string
    args: GqlArg[]
    scalar: string
    directives: string[]
}

type FieldScalarOptions = {
    scalar?: string
    before?: string
    after?: string
    required?: boolean
    list?: boolean
}
