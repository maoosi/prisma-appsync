import { PrismaClient } from '@prisma/client'
import { AuthModes, Operations, AuthActions } from './_constants'

export type ExperimentalOptions = {
    dateTimeFieldsRegex?: RegExp|boolean
}

export type Options = {
    customResolvers?: any
    connectionUrl: string
    debug?: boolean
    sanitize?: boolean
    experimental?: ExperimentalOptions
}

export type PrivateOptions = {
    customResolvers: any
    connectionUrl: string
    debug: boolean
    sanitize: boolean
    experimental?: ExperimentalOptions
}

export type AdapterOptions = {
    customResolvers?: any
    debug?: boolean
    sanitize?: boolean
}

export type CustomResolverProps = {
    prisma?: PrismaClient
    args?: RequestProps
    authIdentity?: AuthIdentityProps
}

export type RequestProps = {
    data?: any
    select?: any
    include?: any
    where?: any
    orderBy?: any
    [key:string]: any
}

export type BeforeResolveProps = {
    authIdentity: AuthIdentityProps
    operation: Operation
    subject: string
    fields: string[]
    prisma: PrismaClient
    requestSetPaths: any
    args: RequestProps
}

export type AfterResolveProps = {
    authIdentity: AuthIdentityProps
    operation: Operation
    subject: string
    fields: string[]
    prisma: PrismaClient
    requestSetPaths: any
    args: RequestProps
    result: any
}

export type AuthType = typeof AuthModes[keyof typeof AuthModes]
export type Operation = typeof Operations[keyof typeof Operations]
export type AuthAction = typeof AuthActions[keyof typeof AuthActions]

export type AuthIdentityProps = {
    authorization: AuthType
    [key:string]: any
}

export type AuthRule = {
    action: AuthAction|AuthAction[]
    subject: string|string[]
    fields?: string[]
    condition?: any|any[]
    reason?:string
}

export type CaslRule = {
    type: 'allow' | 'deny'
    action: AuthAction
    subject: string
    fields?: string[]
    condition?: any
    reason?:string
}

export type CaslAbilityResult = {
    canProceed: boolean,
    reason?: string
}
