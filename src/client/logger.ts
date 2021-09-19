import { CustomError } from 'ts-custom-error'
import { inspect } from 'util'

export { inspect }

// TODO: Comment code

export function log(log:any) {
    if (process.env.PRISMA_APPSYNC_DEBUG === 'true') {
        console.info(`◭ Prisma-AppSync :: ${log}`)
    }
}

export class InternalError extends CustomError {
    private privateMessage:string
    public errorType:string
    public errorInfo:string
    public data:any

    constructor(message?: string) {
        // Shortcut error message
        const privateMessage = message
        super('Internal error.')

        // Customise error
        this.errorType = '500'
        this.errorInfo = 'Internal Server Error'
        this.privateMessage = privateMessage
        this.data = null
        
        // Set name explicitly as minification can mangle class names
        Object.defineProperty(this, 'name', { value: 'InternalError' })
    }

    public getCloudwatchError() {
        return this.privateMessage
    }

    public getReturnError() {
        return {
            error: this.errorInfo,
            status: this.errorType,
        }
    }
}

export class UnauthorizedError extends CustomError {
    private privateMessage:string
    public errorType:string
    public errorInfo:string
    public data:any

    constructor(message?: string) {
        // Shortcut error message
        const privateMessage = message
        super('Unauthorized operation.')

        // Customise error
        this.errorType = '401'
        this.errorInfo = 'Unauthorized'
        this.privateMessage = privateMessage
        this.data = null
        
        // Set name explicitly as minification can mangle class names
        Object.defineProperty(this, 'name', { value: 'UnauthorizedError' })
    }

    public getCloudwatchError() {
        return this.privateMessage
    }

    public getReturnError() {
        return new Error(JSON.stringify({
            error: this.errorInfo,
            status: this.errorType,
        }))
    }
}

export class BadRequestError extends CustomError {
    private privateMessage:string
    public errorType:string
    public errorInfo:string
    public data:any

    constructor(message?: string) {
        // Shortcut error message
        const privateMessage = message
        super('Wrong input parameters.')

        // Customise error
        this.errorType = '400'
        this.errorInfo = 'Bad Request'
        this.privateMessage = privateMessage
        this.data = null
        
        // Set name explicitly as minification can mangle class names
        Object.defineProperty(this, 'name', { value: 'BadRequestError' })
    }

    public getCloudwatchError() {
        return this.privateMessage
    }

    public getReturnError() {
        return {
            error: this.errorInfo,
            status: this.errorType,
        }
    }
}

export class PrismaAppSyncError extends CustomError {
    private privateMessage:string
    public errorType:string
    public errorInfo:string
    public data:any

    constructor(message?: string) {
        // Shortcut error message
        const privateMessage = message
        super('Wrong input parameters.')

        // Customise error
        this.errorType = '400'
        this.errorInfo = 'Bad Request'
        this.privateMessage = privateMessage
        this.data = null
        
        // Set name explicitly as minification can mangle class names
        Object.defineProperty(this, 'name', { value: 'BadRequestError' })
    }

    public getCloudwatchError() {
        return this.privateMessage
    }

    public getReturnError() {
        return {
            error: this.errorInfo,
            status: this.errorType,
        }
    }
}