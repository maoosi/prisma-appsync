export type CompilerOptions = {
    schemaPath?:string
    outputDir?:string
    directiveAliases?:DMMFPAS_DirectiveAliases
    debug?:boolean
}

export interface CompilerOptionsPrivate extends CompilerOptions {
    directiveAliases:DMMFPAS_DirectiveAliases
    schemaPath:string
    outputDir:string
    directivesPriorityScheme:any
    aliasPrefix:string
}

export type DMMFPAS_Model = {
    name:string
    pluralizedName:string
    prismaRef:string
    fields:DMMFPAS_Field[]
    directives?:DMMFPAS_Directives
    idFields:string[]
    subscriptionFields:DMMFPAS_Field[]
}

export type DMMFPAS_DirectiveAliases = {
    [key:string]: string
}

export type DMMFPAS_Directives = {
    [key:string]: string
}

export type DMMFPAS_Field = {
    name:string
    scalar:string
    isRequired:boolean
    isEditable:boolean
    isEnum:boolean
    isUnique:boolean
    directives?:DMMFPAS_Directives
    relation?:DMMFPAS_Relation
    sample:any
}

export type DMMFPAS_Enum = {
    name:string
    values:string[]
}

export type DMMFPAS_Relation = {
    name:string
    kind:'one'|'many'
    type:string
}

export type DMMFPAS_CustomResolver = {
    typeName:string
    fieldName:string
    dataSource:string
    requestMappingTemplate?:string
    responseMappingTemplate?:string
}

export type DMMFPAS = {
    models:DMMFPAS_Model[]
    enums:DMMFPAS_Enum[]
    directiveAliases:DMMFPAS_DirectiveAliases
    customResolvers:DMMFPAS_CustomResolver[]
}
