import { PrismaClient } from '@prisma/client'
import { AuthModes, Operations, AuthActions } from './_constants'

export type CustomPrismaClientOptions = {
    connectionUrl: string
    debug?: boolean
}

export type Options = {
    connectionUrl: string
    debug?: boolean
    sanitize?: boolean
    defaultPagination?: number | false
}

export type PrivateOptions = {
    config: any
    connectionUrl: string
    debug: boolean
    sanitize: boolean
    defaultPagination: number | false
}

export type AdapterOptions = {
    config: any
    defaultPagination: number | false
    customResolvers: any
    debug: boolean
}

export type ResolverOptions = {
    prisma: PrismaClient
    customResolvers: any
    debug: boolean
}

export type CustomResolverProps = {
    args?: RequestProps
    authIdentity?: AuthIdentityProps
}

export type RequestProps = {
    data?: any
    select?: any
    include?: any
    where?: any
    orderBy?: any
    skip?: number
    take?: number
    skipDuplicates?: boolean
    [key:string]: any
}

export type BeforeResolveProps = {
    authIdentity: AuthIdentityProps
    operation: Operation
    subject: string
    fields: string[]
    requestSetPaths: any
    args: RequestProps
}

export type AfterResolveProps = {
    authIdentity: AuthIdentityProps
    operation: Operation
    subject: string
    fields: string[]
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
