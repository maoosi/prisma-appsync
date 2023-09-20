import type { RuntimeConfig } from '@client/types'
import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import * as prettier from 'prettier'
import { merge, uniq } from '@client/utils'
import { type DirectiveAuth, type DirectiveGql, parseDirectives } from './directives'

export default class ClientConfigBuilder {
    private runtimeConfig: Required<RuntimeConfig> = { modelsMapping: {}, fieldsMapping: {}, operations: [] }

    public async createRuntimeConfig(dmmf: DMMF.Document, options?: { defaultDirective?: string }): Promise<RuntimeConfig> {
        // schema models
        dmmf.datamodel?.models.forEach((modelDMMF: DMMF.Model) => {
            const model = this.parseModelDMMF(modelDMMF, options)
            const modelConfig = this.createModelConfig(model)

            this.runtimeConfig.modelsMapping = merge(
                this.runtimeConfig.modelsMapping,
                modelConfig.modelsMapping,
            )
            this.runtimeConfig.fieldsMapping = merge(
                this.runtimeConfig.fieldsMapping,
                modelConfig.fieldsMapping,
            )
            this.runtimeConfig.operations = uniq([
                ...this.runtimeConfig.operations,
                ...modelConfig.operations,
            ])
        })

        // return config
        return {
            modelsMapping: this.runtimeConfig.modelsMapping,
            fieldsMapping: this.runtimeConfig.fieldsMapping,
            operations: this.runtimeConfig.operations,
        }
    }

    public async mergeResolvers(baseResolvers: string, mergeResolvers: string): Promise<string> {
        return this.prettyYaml(`${baseResolvers}\n${mergeResolvers}`)
    }

    private prettyYaml(yaml: string) {
        let prettyYaml = yaml

        try {
            prettyYaml = prettier.format(yaml, {
                parser: 'yaml',
            })
        }
        catch (err) {
            console.error(err)
        }

        return prettyYaml
    }

    private parseModelDMMF(modelDMMF: DMMF.Model, options?: { defaultDirective?: string }): ParsedModel {
        const directives = parseDirectives(modelDMMF, [options?.defaultDirective, modelDMMF.documentation].filter(Boolean).join('\n'))
        const singular = modelDMMF.name
        const prismaRef = singular.charAt(0).toLowerCase() + singular.slice(1)

        return {
            singular,
            plural: plural(singular),
            directives,
            prismaRef,
            fields: modelDMMF.fields,
        }
    }

    private createModelConfig(model: ParsedModel): RuntimeConfig {
        const modelsMapping: any = {}
        const fieldsMapping: any = {}
        const operations: string[] = []

        const modelDefinition = {
            prismaRef: model.prismaRef,
            singular: model.singular,
            plural: model.plural,
        }

        // plural first (order is important)
        if (model.singular !== model.plural)
            modelsMapping[model.plural] = modelDefinition

        // then singular
        modelsMapping[model.singular] = modelDefinition

        // mapping function
        const map = ({ operation, field }: { operation: string; field: DMMF.Field }) => {
            if (!operations.includes(operation))
                operations.push(operation)

            fieldsMapping[`${operation}/${field.name}`] = {
                type: field.type,
                isRelation: Boolean(field?.relationName),
            }
        }

        // fields mapping + operations
        model.fields.forEach((field) => {
            // get
            map({
                operation: model?.directives?.gql?.queries?.get || `get${model.singular}`,
                field,
            })

            // list
            map({
                operation: model?.directives?.gql?.queries?.list || `list${model.plural}`,
                field,
            })

            // count
            map({
                operation: model?.directives?.gql?.queries?.count || `count${model.plural}`,
                field,
            })

            // create
            map({
                operation: model?.directives?.gql?.mutations?.create || `create${model.singular}`,
                field,
            })

            // createMany
            map({
                operation: model?.directives?.gql?.mutations?.createMany || `createMany${model.plural}`,
                field,
            })

            // update
            map({
                operation: model?.directives?.gql?.mutations?.update || `update${model.singular}`,
                field,
            })

            // updateMany
            map({
                operation: model?.directives?.gql?.mutations?.updateMany || `updateMany${model.plural}`,
                field,
            })

            // upsert
            map({
                operation: model?.directives?.gql?.mutations?.upsert || `upsert${model.singular}`,
                field,
            })

            // delete
            map({
                operation: model?.directives?.gql?.mutations?.delete || `delete${model.singular}`,
                field,
            })

            // deleteMany
            map({
                operation: model?.directives?.gql?.mutations?.deleteMany || `deleteMany${model.plural}`,
                field,
            })

            // onCreated
            map({
                operation: model?.directives?.gql?.subscriptions?.onCreated || `onCreated${model.singular}`,
                field,
            })

            // onUpdated
            map({
                operation: model?.directives?.gql?.subscriptions?.onUpdated || `onUpdated${model.singular}`,
                field,
            })

            // onUpserted
            map({
                operation: model?.directives?.gql?.subscriptions?.onUpserted || `onUpserted${model.singular}`,
                field,
            })

            // onDeleted
            map({
                operation: model?.directives?.gql?.subscriptions?.onDeleted || `onDeleted${model.singular}`,
                field,
            })

            // onMutated
            map({
                operation: model?.directives?.gql?.subscriptions?.onMutated || `onMutated${model.singular}`,
                field,
            })

            // onCreatedMany
            map({
                operation: model?.directives?.gql?.subscriptions?.onCreatedMany || `onCreatedMany${model.plural}`,
                field,
            })

            // onUpdatedMany
            map({
                operation: model?.directives?.gql?.subscriptions?.onUpdatedMany || `onUpdatedMany${model.plural}`,
                field,
            })

            // onDeletedMany
            map({
                operation: model?.directives?.gql?.subscriptions?.onDeletedMany || `onDeletedMany${model.plural}`,
                field,
            })

            // onMutatedMany
            map({
                operation: model?.directives?.gql?.subscriptions?.onMutatedMany || `onMutatedMany${model.plural}`,
                field,
            })
        })

        return {
            modelsMapping,
            operations,
            fieldsMapping,
        }
    }
}

type ParsedModel = {
    prismaRef: string
    singular: string
    plural: string
    directives: {
        auth: DirectiveAuth
        gql: DirectiveGql
    }
    fields: DMMF.Field[]
}

export type Resolver = {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}
