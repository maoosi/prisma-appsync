import { PrismaAppSyncAdapter } from './_adapter'
import { PrismaAppSyncResolver } from './_resolver'
import {
    Options,
    PrivateOptions,
    AdapterOptions,
    RequestProps,
    AuthType,
    AuthIdentityProps,
    AuthRule,
    CustomResolverProps,
    AfterResolveProps,
    BeforeResolveProps,
} from './_types'
import { AuthModes, Operations, AuthActions } from './_constants'
import escape from 'validator/lib/escape'
import xss from 'xss'
import { clone } from 'lodash-es'
import { BadRequestError } from './_errors'

export {
    PrismaAppSyncAdapter,
    PrismaAppSyncResolver,
    Options,
    AdapterOptions,
    RequestProps,
    AuthType,
    AuthIdentityProps,
    AuthRule,
    CustomResolverProps,
    AfterResolveProps,
    BeforeResolveProps,
    AuthModes,
    Operations,
    AuthActions
}

export class PrismaAppSync {
    public adapter:PrismaAppSyncAdapter
    public resolver:PrismaAppSyncResolver
    private options:PrivateOptions

    constructor(options:Options) {
        this.options = {
            connectionUrl: options.connectionUrl,
            debug: typeof options.debug !== 'undefined'
                ? options.debug : false,
            sanitize: typeof options.sanitize !== 'undefined'
                ? options.sanitize : true,
            customResolvers: typeof options.customResolvers !== 'undefined'
                ? options.customResolvers : {},
            experimental: {
                dateTimeFieldsRegex:
                    typeof options.experimental !== 'undefined'
                    && typeof options.experimental.dateTimeFieldsRegex !== 'undefined'
                        ? options.experimental.dateTimeFieldsRegex : false,
            }
        }

        return this
    }

    public parseEvent(event:any) {
        this.adapter = new PrismaAppSyncAdapter(event, {
            connectionUrl: this.options.connectionUrl,
            debug: this.options.debug,
            sanitize: this.options.sanitize,
            customResolvers: this.options.customResolvers,
        })

        this.resolver = new PrismaAppSyncResolver({
            connectionUrl: this.options.connectionUrl,
            debug: this.options.debug,
            sanitize: this.options.sanitize,
            customResolvers: this.options.customResolvers,
        })

        return this
    }

    public sanitize(data:any) {
        const outputData = clone(data)

        for (const prop in outputData) {
            if (Object.prototype.hasOwnProperty.call(outputData, prop)) {
                const value = outputData[prop]

                if (typeof value === 'object') {
                    outputData[prop] = this.sanitize(value)
                } else if (!['number', 'boolean', 'bigint'].includes(typeof value)) {
                    outputData[prop] = escape( xss(value) )
                }
            }
        }

        return outputData
    }

    public allow(authorizationRule:AuthRule) {
        this.addAuthorizationRule(authorizationRule, 'allow')
    }

    public deny(authorizationRule:AuthRule) {
        this.addAuthorizationRule(authorizationRule, 'deny')
    }

    private addAuthorizationRule(authorizationRule:AuthRule, type:'allow'|'deny') {
        if (!Array.isArray(authorizationRule.subject)) {
            authorizationRule.subject = [authorizationRule.subject]
        }

        if (!Array.isArray(authorizationRule.action)) {
            authorizationRule.action = [authorizationRule.action]
        }

        if (authorizationRule.condition && !Array.isArray(authorizationRule.condition)) {
            authorizationRule.condition = [authorizationRule.condition]
        } else {
            authorizationRule.condition = [null]
        }

        for (let i = 0; i < authorizationRule.subject.length; i++) {
            const subject = authorizationRule.subject[i]

            for (let j = 0; j < authorizationRule.action.length; j++) {
                let action = authorizationRule.action[j]

                // replace `all` alias to `manage`
                if (action === AuthActions.all) action = AuthActions.manage

                for (let k = 0; k < authorizationRule.condition.length; k++) {
                    const condition = authorizationRule.condition[k]

                    this.resolver.addAuthorizationRule({
                        type,
                        action,
                        subject,
                        ...(condition !== null && {
                            condition
                        }),
                        ...(authorizationRule.fields && {
                            fields: authorizationRule.fields
                        }),
                        ...(authorizationRule.reason && {
                            reason: authorizationRule.reason
                        })
                    })
                }
            }
        }
    }

    private experimentalDateTimeFieldsRegex(data:any) {
        const outputData = clone(data)

        for (const prop in outputData) {
            if (Object.prototype.hasOwnProperty.call(outputData, prop)) {
                const value = outputData[prop]

                if (typeof value === 'object') {
                    outputData[prop] = this.experimentalDateTimeFieldsRegex(value)
                } else if (
                    typeof this.options.experimental.dateTimeFieldsRegex !== 'boolean'
                    && prop.match(this.options.experimental.dateTimeFieldsRegex)
                    && typeof value === 'string'
                ) {
                    outputData[prop] = new Date(value)
                }
            }
        }

        return outputData
    }

    public async resolve() {
        if (this.adapter.operation.length === 0)
            throw new BadRequestError(`Impossible to resolve with undefined operation.`)
        if (this.adapter.model.length === 0)
            throw new BadRequestError(`Impossible to resolve with undefined model.`)

        if (this.options.experimental.dateTimeFieldsRegex)
            this.adapter.args = this.experimentalDateTimeFieldsRegex(this.adapter.args)

        if (this.options.sanitize)
            this.adapter.args = this.sanitize(this.adapter.args)

        this.resolver.setAuthIdentity({
            authIdentityType: this.adapter.authIdentityType,
            authIdentityObj: this.adapter.authIdentityObj
        })

        const result = this.adapter.operation === 'custom'
            ? await this.resolver[this.adapter.operation](
                this.adapter.model,
                this.adapter.args,
                this.options.customResolvers[this.adapter.model]
            )
            : await this.resolver[this.adapter.operation](
                this.adapter.model,
                this.adapter.args
            )

        return result
    }

    public beforeResolve(callbackFunc:Function) {
        this.resolver.setBeforeResolveHook(callbackFunc)

        return this
    }

    public afterResolve(callbackFunc:Function) {
        this.resolver.setAfterResolveHook(callbackFunc)

        return this
    }

    public async $disconnect() {
        return await this.resolver.disconnect()
    }
}