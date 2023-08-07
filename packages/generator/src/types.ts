export interface CompilerOptions {
    schemaPath?: string
    outputDir?: string
    defaultDirective?: string
    previewFeatures?: string[]
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

export interface Document_Model {
    name: string
    pluralizedName: string
    prismaRef: string
    fields: Document_Field[]
    directives: any
    isEditable: boolean
    gql: any
    uniqueFields: Document_UniqueFields[]
    uniqueIndexes: Document_UniqueIndexes[]
    operationFields: Document_Field[]
    subscriptionFields: Document_Field[]
}

export interface Document_Comments {
    auth: any
    gql: any
}

export interface Document_Field {
    name: string
    type?: string
    scalar: string
    directives?: any
    relation?: Document_Relation
    isList: boolean
    isRequired: boolean
    isEditable: boolean
    isEnum: boolean
    isUnique: boolean
    isAutopopulated: boolean
    isCompositeField: boolean
}

export type Document_UniqueFields = string[]

export interface Document_UniqueIndexes {
    name: string
    fields: string[]
}

export interface Document_Enum {
    name: string
    values: string[]
}

export interface Document_Relation {
    name: string
    kind: 'one' | 'many'
    type: string
}

export interface Document_CustomResolver {
    typeName: string
    fieldName: string
    dataSource: string
    requestMappingTemplate?: string
    responseMappingTemplate?: string
}

export interface Document {
    models: Document_Model[]
    enums: Document_Enum[]
    customResolvers: Document_CustomResolver[]
    defaultAuthDirective: string
    usesQueries: boolean
    usesMutations: boolean
    usesSubscriptions: boolean
    previewFeatures: string[]
}
