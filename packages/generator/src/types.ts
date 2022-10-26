export interface CompilerOptions {
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

export interface DMMFPAS_Model {
    name: string
    pluralizedName: string
    prismaRef: string
    fields: DMMFPAS_Field[]
    directives: any
    isEditable: boolean
    gql: any
    uniqueFields: DMMFPAS_UniqueFields[]
    uniqueIndexes: DMMFPAS_UniqueIndexes[]
    operationFields: DMMFPAS_Field[]
    subscriptionFields: DMMFPAS_Field[]
}

export interface DMMFPAS_Comments {
    auth: any
    gql: any
}

export interface DMMFPAS_Field {
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

export type DMMFPAS_UniqueFields = string[]

export interface DMMFPAS_UniqueIndexes {
    name: string
    fields: string[]
}

export interface DMMFPAS_Enum {
    name: string
    values: string[]
}

export interface DMMFPAS_Relation {
    name: string
    kind: 'one' | 'many'
    type: string
}

export interface DMMFPAS_CustomResolver {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}

export interface DMMFPAS {
    models: DMMFPAS_Model[]
    enums: DMMFPAS_Enum[]
    customResolvers: DMMFPAS_CustomResolver[]
    defaultAuthDirective: string
    usesQueries: boolean
    usesMutations: boolean
    usesSubscriptions: boolean
}
