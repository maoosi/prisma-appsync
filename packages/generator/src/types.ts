export type CompilerOptions = {
    schemaPath?: string
    outputDir?: string
    defaultDirective?: string
    debug?: boolean
}

export interface CompilerOptionsPrivate extends CompilerOptions {
    schemaPath: string
    outputDir: string
    defaultDirective: string
    template: {
        [key: string]: {
            label?: ({ name, pluralizedName }: { name: string; pluralizedName: string }) => string
            directives: string[]
            type?: 'Query' | 'Mutation' | 'Subscription'
        }
    }
}

export type DMMFPAS_Model = {
    name: string
    pluralizedName: string
    prismaRef: string
    fields: DMMFPAS_Field[]
    directives: any
    isEditable: boolean
    gql: any
    idFields: string[]
    operationFields: DMMFPAS_Field[]
    subscriptionFields: DMMFPAS_Field[]
}

export type DMMFPAS_Comments = {
    auth: any
    gql: any
}

export type DMMFPAS_Field = {
    name: string
    scalar: string
    isRequired: boolean
    isEditable: boolean
    isEnum: boolean
    isUnique: boolean
    directives?: any
    relation?: DMMFPAS_Relation
    sample: any
}

export type DMMFPAS_Enum = {
    name: string
    values: string[]
}

export type DMMFPAS_Relation = {
    name: string
    kind: 'one' | 'many'
    type: string
}

export type DMMFPAS_CustomResolver = {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}

export type DMMFPAS = {
    models: DMMFPAS_Model[]
    enums: DMMFPAS_Enum[]
    customResolvers: DMMFPAS_CustomResolver[]
    defaultAuthDirective: string
    usesQueries: boolean
    usesMutations: boolean
    usesSubscriptions: boolean
}
