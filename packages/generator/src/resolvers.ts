import type { DMMF } from '@prisma/generator-helper'
import { plural } from 'pluralize'
import * as prettier from 'prettier'
import { type DirectiveAuth, type DirectiveGql, parseDirectives } from './directives'

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
        if (!(model?.directives?.gql?.model === null || model?.directives?.gql?.queries === null)) {
            // get
            if (!(model?.directives?.gql?.queries?.get === null)) {
                this.resolvers.push({
                    typeName: 'Query',
                    fieldName: model?.directives?.gql?.queries?.get || `get${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // list
            if (!(model?.directives?.gql?.queries?.list === null)) {
                this.resolvers.push({
                    typeName: 'Query',
                    fieldName: model?.directives?.gql?.queries?.list || `list${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // count
            if (!(model?.directives?.gql?.queries?.count === null)) {
                this.resolvers.push({
                    typeName: 'Query',
                    fieldName: model?.directives?.gql?.queries?.count || `count${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }
        }
    }

    private createMutationResolvers(model: ParsedModel) {
        if (!(model?.directives?.gql?.model === null || model?.directives?.gql?.mutations === null)) {
            // create
            if (!(model?.directives?.gql?.mutations?.create === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.create || `create${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // createMany
            if (!(model?.directives?.gql?.mutations?.createMany === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.createMany || `createMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // update
            if (!(model?.directives?.gql?.mutations?.update === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.update || `update${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // updateMany
            if (!(model?.directives?.gql?.mutations?.updateMany === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.updateMany || `updateMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // upsert
            if (!(model?.directives?.gql?.mutations?.upsert === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.upsert || `upsert${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // delete
            if (!(model?.directives?.gql?.mutations?.delete === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.delete || `delete${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // deleteMany
            if (!(model?.directives?.gql?.mutations?.deleteMany === null)) {
                this.resolvers.push({
                    typeName: 'Mutation',
                    fieldName: model?.directives?.gql?.mutations?.deleteMany || `deleteMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }
        }
    }

    private createSubscriptionResolvers(model: ParsedModel) {
        if (!(
            model?.directives?.gql?.model === null
            || model?.directives?.gql?.subscriptions === null
            || model?.directives?.gql?.mutations === null
        )) {
            // onCreated
            if (!(model?.directives?.gql?.subscriptions?.onCreated === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onCreated || `onCreated${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onUpdated
            if (!(model?.directives?.gql?.subscriptions?.onUpdated === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onUpdated || `onUpdated${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onUpserted
            if (!(model?.directives?.gql?.subscriptions?.onUpserted === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onUpserted || `onUpserted${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onDeleted
            if (!(model?.directives?.gql?.subscriptions?.onDeleted === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onDeleted || `onDeleted${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onMutated
            if (!(model?.directives?.gql?.subscriptions?.onMutated === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onMutated || `onMutated${model.singular}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onCreatedMany
            if (!(model?.directives?.gql?.subscriptions?.onCreatedMany === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onCreatedMany || `onCreatedMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onUpdatedMany
            if (!(model?.directives?.gql?.subscriptions?.onUpdatedMany === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onUpdatedMany || `onUpdatedMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onDeletedMany
            if (!(model?.directives?.gql?.subscriptions?.onDeletedMany === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onDeletedMany || `onDeletedMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }

            // onMutatedMany
            if (!(model?.directives?.gql?.subscriptions?.onMutatedMany === null)) {
                this.resolvers.push({
                    typeName: 'Subscription',
                    fieldName: model?.directives?.gql?.subscriptions?.onMutatedMany || `onMutatedMany${model.plural}`,
                    dataSource: 'prisma-appsync',
                })
            }
        }
    }
}

type ParsedModel = {
    singular: string
    plural: string
    directives: {
        auth: DirectiveAuth
        gql: DirectiveGql
    }
}

export type Resolver = {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}
