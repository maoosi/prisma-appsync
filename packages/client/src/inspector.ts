/* eslint-disable no-console */
import { inspect as nodeInspect } from 'util'
import type { logLevel } from './defs'

const errorCodes = {
    FORBIDDEN: 401,
    BAD_USER_INPUT: 400,
    INTERNAL_SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429,
}

export interface ErrorExtensions {
    type: keyof typeof errorCodes
    cause?: any
}

export interface ErrorDetails {
    error: string
    type: ErrorExtensions['type']
    code: number
    cause?: ErrorExtensions['cause']
}

export class CustomError extends Error {
    public error: ErrorDetails['error']
    public type: ErrorDetails['type']
    public code: ErrorDetails['code']
    public cause: ErrorDetails['cause']
    public details: ErrorDetails

    constructor(message: string, extensions: ErrorExtensions) {
        super(message)

        this.error = message
        this.type = extensions.type
        this.cause = extensions?.cause?.meta?.cause || extensions?.cause
        this.code = typeof errorCodes[this.type] !== 'undefined' ? errorCodes[this.type] : errorCodes.INTERNAL_SERVER_ERROR

        this.message = JSON.stringify({
            error: this.error,
            type: this.type,
            code: this.code,
        })

        const maxCauseMessageLength = 500

        if (this.cause?.message?.length > maxCauseMessageLength)
            this.cause.message = `... ${this.cause.message.slice(this.cause.message.length - maxCauseMessageLength)}`

        this.details = {
            error: this.error,
            type: this.type,
            code: this.code,
            ...(this.cause && { cause: this.cause }),
        }

        if (!(process?.env?.PRISMA_APPSYNC_TESTING === 'true'))
            log(message, this.details, 'ERROR')
    }
}

export function parseError(error: Error): CustomError {
    if (error instanceof CustomError) {
        return error
    }
    else {
        return new CustomError(error.message, {
            type: 'INTERNAL_SERVER_ERROR',
            cause: error,
        })
    }
}

export function log(message: string, obj?: any, level?: logLevel): void {
    if (canPrintLog(level || 'INFO')) {
        printLog(message, level || 'INFO')

        if (obj) {
            console.log(
                nodeInspect(obj, {
                    compact: false,
                    depth: 5,
                    breakLength: 80,
                    maxStringLength: 800,
                    ...(!process.env.LAMBDA_TASK_ROOT && {
                        colors: true,
                    }),
                }),
            )
        }
    }
}

export function printLog(message: any, level: logLevel): void {
    const timestamp = new Date().toLocaleString(undefined, {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    const prefix = `◭ ${timestamp} <<${level}>>`
    const log = [prefix, message].join(' ')

    if (level === 'ERROR' && canPrintLog(level))
        console.error(`\x1B[31m${log}`)
    else if (level === 'WARN' && canPrintLog(level))
        console.warn(`\x1B[33m${log}`)
    else if (level === 'INFO' && canPrintLog(level))
        console.info(`\x1B[36m${log}`)
}

function canPrintLog(level: logLevel): Boolean {
    if (process?.env?.PRISMA_APPSYNC_TESTING === 'true')
        return false

    const logLevel = String(process.env.PRISMA_APPSYNC_LOG_LEVEL) as logLevel

    return (logLevel === 'ERROR' && level === 'ERROR')
        || (logLevel === 'WARN' && ['WARN', 'ERROR'].includes(level))
        || (logLevel === 'INFO')
}
