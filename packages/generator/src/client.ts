import type { RuntimeConfig } from '@client/types'
import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import * as prettier from 'prettier'
import { merge, uniq } from '@client/utils'
import { type Directives, parseModelDirectives, extractUniqueAuthzModes } from './directives'

export default class ClientConfigBuilder {
    private runtimeConfig: Required<RuntimeConfig> = { modelsMapping: {}, fieldsMapping: {}, operations: [] }

    public async createRuntimeConfig(dmmf: DMMF.Document, options?: { defaultDirective?: string }): Promise<RuntimeConfig> {
        // get all schema authz modes
        const schemaAuthzModes = extractUniqueAuthzModes(dmmf.datamodel, options)

        // schema models
        dmmf.datamodel?.models.forEach((modelDMMF: DMMF.Model) => {
            const model = this.parseModelDMMF(modelDMMF, { ...options, schemaAuthzModes })
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

    private parseModelDMMF(modelDMMF: DMMF.Model, options?: { defaultDirective?: string; schemaAuthzModes: string[] }): ParsedModel {
        const directives = parseModelDirectives({
            modelDMMF,
            defaultDirective: options?.defaultDirective || '',
            schemaAuthzModes: options?.schemaAuthzModes || [],
        })
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
            map({ operation: `get${model.singular}`, field })

            // list
            map({ operation: `list${model.plural}`, field })

            // count
            map({ operation: `count${model.plural}`, field })

            // create
            map({ operation: `create${model.singular}`, field })

            // createMany
            map({ operation: `createMany${model.plural}`, field })

            // update
            map({ operation: `update${model.singular}`, field })

            // updateMany
            map({ operation: `updateMany${model.plural}`, field })

            // upsert
            map({ operation: `upsert${model.singular}`, field })

            // delete
            map({ operation: `delete${model.singular}`, field })

            // deleteMany
            map({ operation: `deleteMany${model.plural}`, field })

            // onCreated
            map({ operation: `onCreated${model.singular}`, field })

            // onUpdated
            map({ operation: `onUpdated${model.singular}`, field })

            // onUpserted
            map({ operation: `onUpserted${model.singular}`, field })

            // onDeleted
            map({ operation: `onDeleted${model.singular}`, field })

            // onMutated
            map({ operation: `onMutated${model.singular}`, field })

            // onCreatedMany
            map({ operation: `onCreatedMany${model.plural}`, field })

            // onUpdatedMany
            map({ operation: `onUpdatedMany${model.plural}`, field })

            // onDeletedMany
            map({ operation: `onDeletedMany${model.plural}`, field })

            // onMutatedMany
            map({ operation: `onMutatedMany${model.plural}`, field })
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
    directives: Directives
    fields: DMMF.Field[]
}

export type Resolver = {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}
