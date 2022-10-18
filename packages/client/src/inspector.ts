/* eslint-disable no-console */
import { inspect as nodeInspect } from 'util'

const errorCodes = {
    FORBIDDEN: 401,
    BAD_USER_INPUT: 400,
    INTERNAL_SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429,
}

interface ErrorExtensions {
    type: keyof typeof errorCodes
    trace?: string[]
    [key: string]: any
}

interface ErrorDetails {
    error: string
    type: ErrorExtensions['type']
    code: number
    trace: ErrorExtensions['trace']
}

export type logLevel = 'INFO' | 'WARN' | 'ERROR'

export class CustomError extends Error {
    public error: ErrorDetails['error']
    public type: ErrorDetails['type']
    public code: ErrorDetails['code']
    public trace: ErrorDetails['trace']
    public details: ErrorDetails

    constructor(message: string, extensions: ErrorExtensions) {
        super(message)

        this.error = message
        this.type = extensions.type
        this.trace = extensions?.trace || []
        this.code
            = typeof errorCodes[this.type] !== 'undefined' ? errorCodes[this.type] : errorCodes.INTERNAL_SERVER_ERROR

        if (this.stack && this.stack.length > 0)
            this.trace.unshift(this.stack)

        this.message = JSON.stringify({
            error: this.error,
            type: this.type,
            code: this.code,
        })

        this.details = {
            error: this.error,
            type: this.type,
            code: this.code,
            trace: this.trace,
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
            trace: error?.stack ? [error.stack] : [],
        })
    }
}

export function log(message: string, obj?: any, level?: logLevel): void {
    const debug = process.env.PRISMA_APPSYNC_DEBUG === 'true'
    const usePrint = debug || ['WARN', 'ERROR'].includes(level || 'INFO')

    if (usePrint && !(process?.env?.PRISMA_APPSYNC_TESTING === 'true')) {
        printLog(message, level || 'INFO')

        if (obj) {
            console.log(
                nodeInspect(obj, {
                    compact: false,
                    depth: 5,
                    breakLength: 80,
                    maxStringLength: 300,
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
    const debug = process.env.PRISMA_APPSYNC_DEBUG === 'true'

    if (level === 'ERROR')
        console.error(`\x1B[31m${log}`)
    else if (level === 'WARN')
        console.warn(`\x1B[33m${log}`)
    else if (debug)
        console.info(`\x1B[36m${log}`)
}
