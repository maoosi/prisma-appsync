import { merge } from 'lodash-es'
import {
    RequestProps,
    AdapterOptions,
    AuthType,
    Operation
} from './_types'
import {
    PrismaAppSyncOperations,
    AuthModes,
    Operations,
} from './_constants'
import { BadRequestError, InternalError } from './_errors'

export class PrismaAppSyncAdapter {
    private customResolvers:any
    private debug:boolean
    private defaultPagination:number|false
    private config:any
    public operation:Operation
    public model:string
    public args:RequestProps
    public requestSetPaths:string[]
    public authIdentityType:AuthType
    public authIdentityObj:any

    constructor(event:any, options:AdapterOptions) {
        this.operation = null
        this.model = String()
        this.requestSetPaths = []
        this.args = {}
        this.authIdentityType = null
        this.authIdentityObj = {}
        this.customResolvers = options.customResolvers
        this.debug = options.debug
        this.defaultPagination = options.defaultPagination
        this.config = options.config

        this.verifyIntegrity(event)
        this.parseRequest(event)
        this.parseArgs(event)
        this.detectCallerIdentity(event)

        if (this.debug) {
            console.log('Adapter output: ', JSON.stringify({
                operation: this.operation,
                model: this.model,
                args: this.args,
            }))
        }

        return this
    }

    private detectCallerIdentity(event:any) {
        if (typeof event.identity === 'undefined' || !event.identity || event.identity.length < 1) {
            this.authIdentityType = AuthModes.API_KEY
            this.authIdentityObj = !event.request || !event.request.headers
                ? {} : {
                    ...(typeof event.request.headers['x-api-key'] !== 'undefined' && {
                        requestApiKey: event.request.headers['x-api-key'],
                    }),
                    ...(typeof event.request.headers['user-agent'] !== 'undefined' && {
                        requestUserAgent: event.request.headers['user-agent'],
                    })
                }
        } else if (typeof event.identity['sub'] !== 'undefined') {
            this.authIdentityType = AuthModes.AMAZON_COGNITO_USER_POOLS
            this.authIdentityObj = event.identity
        } else if (
            typeof event.identity['cognitoIdentityAuthType'] !== 'undefined' ||
            typeof event.identity['cognitoIdentityAuthProvider'] !== 'undefined' ||
            typeof event.identity['cognitoIdentityPoolId'] !== 'undefined' ||
            typeof event.identity['cognitoIdentityId'] !== 'undefined'
        ) {
            this.authIdentityType = AuthModes.AWS_IAM
            this.authIdentityObj = event.identity
        } else {
            throw new InternalError(`Couldn't detect caller identity from: ${JSON.stringify(event.identity)}`)
        }
    }

    private verifyIntegrity(event:any) {
        if (!event.info || !event.info.fieldName) {
            throw new InternalError(`Incomplete event input received (missing info): ${JSON.stringify(event)}`)
        }

        if (!event.arguments) {
            throw new InternalError(`Incomplete event input received (missing arguments): ${JSON.stringify(event)}`)
        }
        
        if (!event.info.selectionSetList) {
            throw new InternalError(`Incomplete event input received (missing selectionSetList): ${JSON.stringify(event)}`)
        }
    }

    private parseRequest(event:any) {
        const fieldName:string = String(event.info.fieldName)
        const isCustomResolver:boolean = typeof this.customResolvers[fieldName] !== 'undefined'

        if (isCustomResolver) {
            this.operation = Operations.custom
            this.model = fieldName
        } else {

            // find CRUD operation from list
            const operation:any = PrismaAppSyncOperations.find((op:string) => {
                return fieldName.toLowerCase().startsWith(op.toLowerCase())
            })

            // if no CRUD operation found
            if (!operation) {
                throw new BadRequestError(
                    `Error reading model and operation from fieldName: ${JSON.stringify(fieldName)}`
                )
            }

            // record operation
            this.operation = operation

            // record model
            const modelName = fieldName.replace(this.operation, '')

            if (!this.config || typeof this.config.prismaClientModels === 'undefined' || typeof this.config.prismaClientModels[modelName] === 'undefined') {
                throw new InternalError('Issue parsing prismaClientModels from auto-injected environment variable `PRISMA_APPSYNC_GENERATED_CONFIG`.')
            }

            this.model = this.config.prismaClientModels[modelName]
        }

        return this.parseArgs(event)
    }

    private parseArgs(event:any) {
        this.args = merge({}, this.args, this.parseSelectionList(event.info.selectionSetList))

        if (this.operation !== Operations.custom) {
            if (typeof event.arguments.data !== 'undefined') {
                this.args.data = event.arguments.data
            }
    
            if (typeof event.arguments.where !== 'undefined') {
                this.args.where = event.arguments.where
            }

            const _getOrList:Operation[] = [Operations.get, Operations.list]
            if (typeof event.arguments.orderBy !== 'undefined' && _getOrList.includes(this.operation)) {
                this.args.orderBy = this.parseOrderBy(event.arguments.orderBy)
            }

            if (this.operation === Operations.list || this.operation === Operations.count) {
                if (typeof event.arguments.skip !== 'undefined' ) {
                    this.args.skip = event.arguments.skip
                } else if (this.defaultPagination !== false && this.operation === Operations.list) {
                    this.args.skip = 0
                }

                if (typeof event.arguments.take !== 'undefined' ) {
                    this.args.take = event.arguments.take
                } else if (this.defaultPagination !== false && this.operation === Operations.list) {
                    this.args.take = this.defaultPagination
                }
            } else if (this.operation === Operations.createMany) {
                if (typeof event.arguments.skipDuplicates !== 'undefined' ) {
                    this.args.skipDuplicates = event.arguments.skipDuplicates
                }
            }
        } else {
            this.args = merge({}, this.args, event.arguments)
        }

        return this
    }

    private getInclude(parts:any): any {
        const field = parts[0]
        const value = parts.length > 1
            ? this.getSelect(parts.splice(1))
            : true

        return {
            include: {
                [field]: value
            }
        }
    }

    private getSelect(parts:any): any {
        const field = parts[0]
        const value = parts.length > 1 
            ? this.getSelect(parts.splice(1))
            : true

        return {
            select: {
                [field]: value
            }
        }
    }

    private parseSelectionList(selectionSetList:any) {
        let args:any = {}

        for (let i = 0; i < selectionSetList.length; i++) {
            const path = selectionSetList[i]
            const parts = path.split('/')

            if (!parts.includes('__typename')) {
                if (parts.length > 1) args = merge({}, args, this.getInclude(parts))
                else args = merge({}, args, this.getSelect(parts))
            }
        }

        if (args.include) {
            for (const include in args.include) {
                if (typeof args.select[include] !== 'undefined') delete args.select[include]
            }

            args.select = merge({}, args.select, args.include)
            delete args.include
        }
        
        return args
    }

    private getOrderBy(sortObj:any): any {
        const key:any = Object.keys(sortObj)[0]
        const value = typeof sortObj[key] === 'object'
            ? this.getOrderBy(sortObj[key])
            : sortObj[key].toLowerCase()
    
        return {
            [key]: value
        }
    }

    private parseOrderBy(orderByInputs:any) {
        const orderByOutput:any = []
    
        const orderByInputsArray = Array.isArray(orderByInputs)
            ? orderByInputs : [orderByInputs]
    
        orderByInputsArray.forEach((orderByInput:any) => {
            orderByOutput.push( this.getOrderBy(orderByInput) )
        })
    
        return orderByOutput
    }
}