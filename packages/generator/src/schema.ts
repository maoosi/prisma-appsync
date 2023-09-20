import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import flow from 'lodash/flow'
import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import { uniqBy } from '@client/utils'
import * as prettier from 'prettier'
import { type Directives, parseDirectives } from './directives'

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

        // schema models
        dmmf.datamodel?.models.forEach((modelDMMF: DMMF.Model) => {
            const model = this.parseModelDMMF(modelDMMF, options)

            this.createModelTypes(model)
            this.createModelInputs(model)
            this.createModelQueries(model)
            this.createModelMutations(model)
            this.createModelSubscriptions(model)
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

    private parseModelDMMF(modelDMMF: DMMF.Model, options?: { defaultDirective?: string }): ParsedModel {
        const directives = parseDirectives(modelDMMF, [options?.defaultDirective, modelDMMF.documentation].filter(Boolean).join('\n'))

        const fields = modelDMMF.fields.filter(field => !(directives?.gql?.fields?.[field.name] === null))

        const getScalar = (field: DMMF.Field, inject?: FieldScalarOptions) => {
            return this.getFieldScalar(field, { scalar: directives?.gql?.scalars?.[field.name], ...inject })
        }

        const primaryKeys = modelDMMF.primaryKey?.fields || []

        const primaryKeysFields = fields
            ?.filter(field => primaryKeys.includes(field.name))
            ?.map(field => ({ name: field.name, scalar: getScalar(field) })) || []

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
            ...primaryKeysFields?.length
                ? [{ name: primaryKeysFields.map(pK => pK.name).join('_'), scalar: `${pascalCase(primaryKeys.join(' '))}FieldsInput` }]
                : [],
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
                            scalar = getScalar(field, { after: 'EnumListFilter', required: false })
                        else
                            scalar = getScalar(field, { after: 'ListFilter', required: false })
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
            primaryKeys,
            gqlFields: {
                operations: operationsFields,
                whereInput: whereInputFields,
                whereUniqueInput: whereUniqueInputFields,
                extendedWhereUniqueInput: extendedWhereUniqueInputFields,
                scalarWhereInput: scalarWhereInputFields,
                primaryKeys: primaryKeysFields,
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
                    scalar: model.getScalar(field),
                }
            }),
            directives: model?.directives?.get('model'),
        })
    }

    private createModelInputs(model: ParsedModel) {
        if (model.primaryKeys?.length) {
            this.inputs.push({
                name: `${pascalCase(model.primaryKeys.join(' '))}FieldsInput`,
                fields: model.gqlFields.primaryKeys,
            })
        }

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
                    const name = field.isList
                        ? `${model.singular}${upperFirst(plural(field.name))}CreateNestedInput`
                        : `${model.singular}${upperFirst(field.name)}CreateNestedInput`

                    const fields = field.isList
                        ? [
                                { name: 'create', scalar: `[${field.type}CreateInput!]` },
                                { name: 'connect', scalar: `[${field.type}WhereUniqueInput!]` },
                                { name: 'connectOrCreate', scalar: `[${field.type}ConnectOrCreateInput!]` },
                            ]
                        : [
                                { name: 'create', scalar: `${field.type}CreateInput` },
                                { name: 'connect', scalar: `${field.type}WhereUniqueInput` },
                                { name: 'connectOrCreate', scalar: `${field.type}ConnectOrCreateInput` },
                            ]

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
                    const name = field.isList
                        ? `${model.singular}${upperFirst(plural(field.name))}UpdateNestedInput`
                        : `${model.singular}${upperFirst(field.name)}UpdateNestedInput`

                    const fields = field.isList
                        ? [
                                { name: 'connect', scalar: `[${field.type}WhereUniqueInput!]` },
                                { name: 'create', scalar: `[${field.type}CreateInput!]` },
                                { name: 'connectOrCreate', scalar: `[${field.type}ConnectOrCreateInput!]` },
                                { name: 'update', scalar: `[${field.type}UpdateUniqueInput!]` },
                                { name: 'upsert', scalar: `[${field.type}UpsertUniqueInput!]` },
                                { name: 'delete', scalar: `[${field.type}ExtendedWhereUniqueInput!]` },
                                { name: 'disconnect', scalar: `[${field.type}ExtendedWhereUniqueInput!]` },
                                { name: 'deleteMany', scalar: `[${field.type}ScalarWhereInput!]` },
                                { name: 'set', scalar: `[${field.type}WhereUniqueInput!]` },
                                { name: 'updateMany', scalar: `[${field.type}UpdateManyInput!]` },
                            ]
                        : [
                                { name: 'connect', scalar: `${field.type}WhereUniqueInput` },
                                { name: 'create', scalar: `${field.type}CreateInput` },
                                { name: 'connectOrCreate', scalar: `${field.type}ConnectOrCreateInput` },
                                { name: 'update', scalar: `${field.type}UpdateInput` },
                                { name: 'upsert', scalar: `${field.type}UpsertInput` },
                                { name: 'delete', scalar: 'Boolean' },
                                { name: 'disconnect', scalar: 'Boolean' },
                            ]

                    return {
                        name,
                        fields,
                    }
                }) || []
            , 'name')

        nestedUpdateInputs.forEach((nestedUpdateInput) => {
            this.inputs.push(nestedUpdateInput)
        })

        this.inputs.push({
            name: `${model.singular}CreateInput`,
            fields: model.fields
                ?.filter(field => !field?.isReadOnly)
                ?.map((field) => {
                    if (field?.relationName) {
                        const scalar = field.isList
                            ? `${model.singular}${upperFirst(plural(field.name))}CreateNestedInput`
                            : `${model.singular}${upperFirst(field.name)}CreateNestedInput`

                        return {
                            name: field.name,
                            scalar: model.getScalar(field, { scalar, required: false, list: false }),
                        }
                    }
                    else {
                        return {
                            name: field.name,
                            scalar: model.getScalar(field, { required: (field.isRequired && !field.default) }),
                        }
                    }
                }) || [],
        })

        this.inputs.push({
            name: `${model.singular}CreateManyInput`,
            fields: model.fields
                ?.filter(field => !field?.relationName && !field?.isReadOnly)
                ?.map(field => ({ name: field.name, scalar: model.getScalar(field, { required: (field.isRequired && !field.default) }) })) || [],
        })

        this.inputs.push({
            name: `${model.singular}UpdateInput`,
            fields: model.fields
                ?.filter(field => !field?.isReadOnly)
                ?.map((field) => {
                    if (field?.relationName) {
                        const scalar = field.isList
                            ? `${model.singular}${upperFirst(plural(field.name))}UpdateNestedInput`
                            : `${model.singular}${upperFirst(field.name)}UpdateNestedInput`

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

        this.inputs.push({
            name: `${model.singular}UpdateManyInput`,
            fields: [
                { name: 'where', scalar: `${model.singular}ScalarWhereInput!` },
                { name: 'data', scalar: `${model.singular}UpdateInput!` },
            ],
        })

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

        this.inputs.push({
            name: `${model.singular}ConnectOrCreateInput`,
            fields: [
                { name: 'where', scalar: `${model.singular}WhereUniqueInput!` },
                { name: 'create', scalar: `${model.singular}CreateInput!` },
            ],
        })
    }

    private createModelQueries(model: ParsedModel) {
        if (!(model?.directives?.gql?.model === null || model?.directives?.gql?.queries === null)) {
            // get
            if (!(model?.directives?.gql?.queries?.get === null)) {
                this.queries.push({
                    name: model?.directives?.gql?.queries?.get || `get${model.singular}`,
                    comment: `Find a single ${model.singular} record by unique identifier.`,
                    args: [
                        { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                    ],
                    scalar: `${model.singular}`,
                    directives: model?.directives?.get('get'),
                })
            }

            // list
            if (!(model?.directives?.gql?.queries?.list === null)) {
                this.queries.push({
                    name: model?.directives?.gql?.queries?.list || `list${model.plural}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}WhereInput` },
                        { name: 'orderBy', scalar: `[${model.singular}OrderByInput!]` },
                        { name: 'skip', scalar: 'Int' },
                        { name: 'take', scalar: 'Int' },
                    ],
                    scalar: `[${model.singular}!]`,
                    directives: model?.directives?.get('list'),
                })
            }

            // count
            if (!(model?.directives?.gql?.queries?.count === null)) {
                this.queries.push({
                    name: model?.directives?.gql?.queries?.count || `count${model.plural}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}WhereInput` },
                        { name: 'orderBy', scalar: `[${model.singular}OrderByInput!]` },
                        { name: 'skip', scalar: 'Int' },
                        { name: 'take', scalar: 'Int' },
                    ],
                    scalar: 'Int!',
                    directives: model?.directives?.get('count'),
                })
            }
        }
    }

    private createModelMutations(model: ParsedModel) {
        if (!(model?.directives?.gql?.model === null || model?.directives?.gql?.mutations === null)) {
            // create
            if (!(model?.directives?.gql?.mutations?.create === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.create || `create${model.singular}`,
                    args: [
                        { name: 'data', scalar: `${model.singular}CreateInput!` },
                    ],
                    scalar: `${model.singular}!`,
                    directives: model?.directives?.get('create'),
                })
            }

            // createMany
            if (!(model?.directives?.gql?.mutations?.createMany === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.createMany || `createMany${model.plural}`,
                    args: [
                        { name: 'data', scalar: `[${model.singular}CreateManyInput!]` },
                        { name: 'skipDuplicates', scalar: 'Boolean' },
                    ],
                    scalar: 'BatchPayload!',
                    directives: model?.directives?.get('createMany'),
                })
            }

            // update
            if (!(model?.directives?.gql?.mutations?.update === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.update || `update${model.singular}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                        { name: 'data', scalar: `${model.singular}UpdateInput` },
                        ...model.gqlFields?.operations?.length ? [{ name: 'operation', scalar: `${model.singular}OperationInput` }] : [],
                    ],
                    scalar: `${model.singular}!`,
                    directives: model?.directives?.get('update'),
                })
            }

            // updateMany
            if (!(model?.directives?.gql?.mutations?.updateMany === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.updateMany || `updateMany${model.plural}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}WhereInput!` },
                        { name: 'data', scalar: `${model.singular}UpdateInput` },
                        ...model.gqlFields?.operations?.length ? [{ name: 'operation', scalar: `${model.singular}OperationInput` }] : [],
                    ],
                    scalar: 'BatchPayload!',
                    directives: model?.directives?.get('updateMany'),
                })
            }

            // upsert
            if (!(model?.directives?.gql?.mutations?.upsert === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.upsert || `upsert${model.singular}`,
                    args: [
                        { name: 'create', scalar: `${model.singular}CreateInput!` },
                        { name: 'update', scalar: `${model.singular}UpdateInput!` },
                        { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                    ],
                    scalar: `${model.singular}!`,
                    directives: model?.directives?.get('upsert'),
                })
            }

            // delete
            if (!(model?.directives?.gql?.mutations?.delete === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.delete || `delete${model.singular}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}ExtendedWhereUniqueInput!` },
                    ],
                    scalar: `${model.singular}!`,
                    directives: model?.directives?.get('delete'),
                })
            }

            // deleteMany
            if (!(model?.directives?.gql?.mutations?.deleteMany === null)) {
                this.mutations.push({
                    name: model?.directives?.gql?.mutations?.deleteMany || `deleteMany${model.plural}`,
                    args: [
                        { name: 'where', scalar: `${model.singular}WhereInput!` },
                    ],
                    scalar: 'BatchPayload!',
                    directives: model?.directives?.get('deleteMany'),
                })
            }
        }
    }

    private createModelSubscriptions(model: ParsedModel) {
        if (!(
            model?.directives?.gql?.model === null
            || model?.directives?.gql?.subscriptions === null
            || model?.directives?.gql?.mutations === null
        )) {
            // onCreated
            if (!(model?.directives?.gql?.subscriptions?.onCreated === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onCreated || `onCreated${model.singular}`,
                    args: model.gqlFields.whereUniqueInput.slice(0, 8),
                    scalar: `${model.singular}!`,
                    directives: [`@aws_subscribe(mutations: ["create${model.singular}"])`, ...model?.directives?.get('onCreated')],
                })
            }

            // onUpdated
            if (!(model?.directives?.gql?.subscriptions?.onUpdated === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onUpdated || `onUpdated${model.singular}`,
                    args: model.gqlFields.whereUniqueInput.slice(0, 8),
                    scalar: `${model.singular}!`,
                    directives: [`@aws_subscribe(mutations: ["update${model.singular}"])`, ...model?.directives?.get('onUpdated')],
                })
            }

            // onUpserted
            if (!(model?.directives?.gql?.subscriptions?.onUpserted === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onUpserted || `onUpserted${model.singular}`,
                    args: model.gqlFields.whereUniqueInput.slice(0, 8),
                    scalar: `${model.singular}!`,
                    directives: [`@aws_subscribe(mutations: ["upsert${model.singular}"])`, ...model?.directives?.get('onUpserted')],
                })
            }

            // onDeleted
            if (!(model?.directives?.gql?.subscriptions?.onDeleted === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onDeleted || `onDeleted${model.singular}`,
                    args: model.gqlFields.whereUniqueInput.slice(0, 8),
                    scalar: `${model.singular}!`,
                    directives: [`@aws_subscribe(mutations: ["delete${model.singular}"])`, ...model?.directives?.get('onDeleted')],
                })
            }

            // onMutated
            if (!(model?.directives?.gql?.subscriptions?.onMutated === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onMutated || `onMutated${model.singular}`,
                    args: model.gqlFields.whereUniqueInput.slice(0, 8),
                    scalar: `${model.singular}!`,
                    directives: [`@aws_subscribe(mutations: ["create${model.singular}", "update${model.singular}", "upsert${model.singular}", "delete${model.singular}"])`, ...model?.directives?.get('onMutated')],
                })
            }

            // onCreatedMany
            if (!(model?.directives?.gql?.subscriptions?.onCreatedMany === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onCreatedMany || `onCreatedMany${model.plural}`,
                    args: [],
                    scalar: 'BatchPayload!',
                    directives: [`@aws_subscribe(mutations: ["createMany${model.plural}"])`, ...model?.directives?.get('onCreatedMany')],
                })
            }

            // onUpdatedMany
            if (!(model?.directives?.gql?.subscriptions?.onUpdatedMany === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onUpdatedMany || `onUpdatedMany${model.plural}`,
                    args: [],
                    scalar: 'BatchPayload!',
                    directives: [`@aws_subscribe(mutations: ["updateMany${model.plural}"])`, ...model?.directives?.get('onUpdatedMany')],
                })
            }

            // onDeletedMany
            if (!(model?.directives?.gql?.subscriptions?.onDeletedMany === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onDeletedMany || `onDeletedMany${model.plural}`,
                    args: [],
                    scalar: 'BatchPayload!',
                    directives: [`@aws_subscribe(mutations: ["deleteMany${model.plural}"])`, ...model?.directives?.get('onDeletedMany')],
                })
            }

            // onMutatedMany
            if (!(model?.directives?.gql?.subscriptions?.onMutatedMany === null)) {
                this.subscriptions.push({
                    name: model?.directives?.gql?.subscriptions?.onMutatedMany || `onMutatedMany${model.plural}`,
                    args: [],
                    scalar: 'BatchPayload!',
                    directives: [`@aws_subscribe(mutations: ["createMany${model.plural}", "updateMany${model.plural}", "deleteMany${model.plural}"])`, ...model?.directives?.get('onMutatedMany')],
                })
            }
        }
    }

    private getFieldScalar(field: DMMF.Field, inject?: FieldScalarOptions) {
        const isRequired = typeof inject?.required !== 'undefined' ? inject.required : field.isRequired
        const isList = typeof inject?.list !== 'undefined' ? inject.list : field.isList

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
                    t.fields.map(f => `${f.name}: ${f.scalar}`).join('\n'),
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
                    i.fields.map(f => `${f.name}: ${f.scalar}`).join('\n'),
                    '}',
                ].join('\n')
            }).join('\n\n'),
        ].join('\n')

        const queries = [
            'type Query {',
            this.queries.map((q) => {
                const args = q.args.map(arg => `${arg.name}: ${arg.scalar}`)
                return [
                    q?.comment ? `# ${q.comment}` : '',
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

        const mutations = [
            'type Mutation {',
            this.mutations.map((m) => {
                const args = m.args.map(arg => `${arg.name}: ${arg.scalar}`)
                return [
                    m?.comment ? `# ${m.comment}` : '',
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

        const subscriptions = [
            'type Subscription {',
            this.subscriptions.map((s) => {
                const args = s.args.map(arg => `${arg.name}: ${arg.scalar}`)
                return [
                    s?.comment ? `# ${s.comment}` : '',
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
        primaryKeys: GqlField[]
        whereInput: GqlField[]
        whereUniqueInput: GqlField[]
        extendedWhereUniqueInput: GqlField[]
        scalarWhereInput: GqlField[]
    }
    directives: Directives
    primaryKeys: string[]
    getScalar: (field: DMMF.Field, inject?: FieldScalarOptions) => string
    documentation: string
    defaultDirective: string
}

type GqlField = {
    name: string
    scalar: string
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
