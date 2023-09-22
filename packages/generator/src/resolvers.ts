import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import * as prettier from 'prettier'
import { type Directives, parseDirectives } from './directives'

export default class ResolversBuilder {
    private resolvers: Resolver[] = []

    public async createResolvers(dmmf: DMMF.Document, options?: { defaultDirective?: string }): Promise<string> {
        // schema models
        dmmf.datamodel?.models.forEach((modelDMMF: DMMF.Model) => {
            const model = this.parseModelDMMF(modelDMMF, options)

            this.createQueryResolvers(model)
            this.createMutationResolvers(model)
            this.createSubscriptionResolvers(model)
        })

        // return appsync gql resolvers (yaml)
        return await this.buildAppSyncResolvers()
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

        return {
            singular: modelDMMF.name,
            plural: plural(modelDMMF.name),
            directives,
        }
    }

    private async buildAppSyncResolvers() {
        const yaml = this.resolvers.map((r) => {
            return [
                `- typeName: ${r.typeName}`,
                `  fieldName: ${r.fieldName}`,
                `  dataSource: ${r.dataSource}`,
            ].join('\n')
        }).join('\n')

        return this.prettyYaml(yaml)
    }

    private createQueryResolvers(model: ParsedModel) {
        // get
        if (model?.directives.canOutputGQL('get')) {
            this.resolvers.push({
                typeName: 'Query',
                fieldName: `get${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // list
        if (model?.directives.canOutputGQL('list')) {
            this.resolvers.push({
                typeName: 'Query',
                fieldName: `list${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // count
        if (model?.directives.canOutputGQL('count')) {
            this.resolvers.push({
                typeName: 'Query',
                fieldName: `count${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }
    }

    private createMutationResolvers(model: ParsedModel) {
        // create
        if (model?.directives.canOutputGQL('create')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `create${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // createMany
        if (model?.directives.canOutputGQL('createMany')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `createMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // update
        if (model?.directives.canOutputGQL('update')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `update${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // updateMany
        if (model?.directives.canOutputGQL('updateMany')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `updateMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // upsert
        if (model?.directives.canOutputGQL('upsert')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `upsert${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // delete
        if (model?.directives.canOutputGQL('delete')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `delete${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // deleteMany
        if (model?.directives.canOutputGQL('deleteMany')) {
            this.resolvers.push({
                typeName: 'Mutation',
                fieldName: `deleteMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }
    }

    private createSubscriptionResolvers(model: ParsedModel) {
        // onCreated
        if (model?.directives.canOutputGQL('onCreated')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onCreated${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onUpdated
        if (model?.directives.canOutputGQL('onUpdated')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onUpdated${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onUpserted
        if (model?.directives.canOutputGQL('onUpserted')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onUpserted${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onDeleted
        if (model?.directives.canOutputGQL('onDeleted')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onDeleted${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onMutated
        if (model?.directives.canOutputGQL('onMutated')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onMutated${model.singular}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onCreatedMany
        if (model?.directives.canOutputGQL('onCreatedMany')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onCreatedMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onUpdatedMany
        if (model?.directives.canOutputGQL('onUpdatedMany')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onUpdatedMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onDeletedMany
        if (model?.directives.canOutputGQL('onDeletedMany')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onDeletedMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }

        // onMutatedMany
        if (model?.directives.canOutputGQL('onMutatedMany')) {
            this.resolvers.push({
                typeName: 'Subscription',
                fieldName: `onMutatedMany${model.plural}`,
                dataSource: 'prisma-appsync',
            })
        }
    }
}

type ParsedModel = {
    singular: string
    plural: string
    directives: Directives
}

export type Resolver = {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}
