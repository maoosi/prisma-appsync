import {
    PrivateOptions,
    RequestProps,
    AuthType,
    AuthIdentityProps,
    CaslRule,
    CustomResolverProps,
    AuthAction,
    BeforeResolveProps,
    AfterResolveProps,
    Operation,
    CaslAbilityResult,
    ResolverOptions
} from './_types'
import { PrismaExclWords, AuthActions, Operations } from './_constants'
import { dot } from 'dot-object'
import { createAliasResolver, defineAbility, subject } from '@casl/ability'
import { difference, merge, keys, every, upperFirst, pick } from 'lodash-es'
import { InternalError, UnauthorizedError } from './_errors'
import { PrismaClient } from '@prisma/client'

export class PrismaAppSyncResolver {
    private debug:boolean
    private authIdentity:AuthIdentityProps
    private beforeResolveHook:Function
    private beforeResolveHookProps:BeforeResolveProps
    private afterResolveHook:Function
    private prisma:PrismaClient
    private authorizationRules:CaslRule[]

    constructor(options:ResolverOptions) {
        this.prisma = options.prisma
        this.debug = options.debug
        this.authIdentity = { authorization: null }
        this.authorizationRules = []
        this.beforeResolveHook = async () => { return true }
        this.afterResolveHook = async () => { return true }

        return this
    }

    private getRequestSetPaths(
        { operation, model, args }:
        { operation:Operation, model:string, args:RequestProps }
    ) {
        const requestSetPaths:string[] = []
        const dotPaths = merge(
            {}, dot(args.select || {}), dot(args.include || {}), dot(args.data || {})
        )

        for (const key in dotPaths) {
            if (Object.prototype.hasOwnProperty.call(dotPaths, key)) {
                const fieldsPath = difference(key.split('.'), PrismaExclWords).join('/')
                const requestPath:string = `${operation}/${model}/${fieldsPath}`

                if (!requestSetPaths.includes(requestPath)) {
                    requestSetPaths.push(requestPath)
                }
            }
        }

        return requestSetPaths
    }

    private async getAbilitySubjectEntity(
        { args, model, action, conditionsKeys }:
        { args:RequestProps, model:string, action:AuthAction, conditionsKeys:string[] }
    ) {
        // conditions in rules can only apply to single elements (get, update, delete)
        if (!args.where)
            throw new InternalError(`Authorization rules conditions cannot be applied to ${action} (no where clause available)`)

        // determine what fields need to be selected for the rule condition
        const select = {}
        conditionsKeys.forEach((key) => select[key] = true)

        // create the authorization entity
        // (object user is trying to query, formatted to the rule condition)
        let entity = {}
        let entitySource = null

        // verify if the query already contains the relevant conditions
        // or if we need to get them from the entity dynamically
        const diff = difference(keys(select), keys(args.where))

        // JEST testing scenario
        if (process.env.JEST_WORKER_ID) {
            entitySource = 'JEST'
            entity = JSON.parse(process.env.JEST_ENTITY)
        }
        // we don't need a query
        else if (diff.length === 0) {
            entitySource = 'where params'
            entity = pick(args.where, keys(select))
        }
        // we need a query
        else {
            entitySource = 'database'
            entity = await this.prisma[model].findUnique({
                where: args.where,
                select
            })
        }

        if (this.debug) {
            console.log(
                `Authorization entity for operation on ${model} sourced from [${entitySource}]: `,
                JSON.stringify(entity)
            )
        }

        return entity
    }

    private async isAuthorizedQuery(
        { args, action, subjectName, model, fields }: 
        { args:RequestProps, action:AuthAction, subjectName:string, model:string, fields:string[] }
    ):Promise<CaslAbilityResult> {
        const abilityResult:CaslAbilityResult = { canProceed: true }

        if (this.authorizationRules.length < 1) {
            abilityResult.canProceed = true
            return abilityResult
        }
    
        // define action aliases (or groups)
        const actionAliases = {
            access: [ AuthActions.get, AuthActions.list ],
            modify: [
                AuthActions.upsert,
                AuthActions.update,
                AuthActions.delete,
            ],
        }
        const resolveAction = createAliasResolver(actionAliases)

        // collect conditions
        let conditionsKeys = []

        // define casl ability
        const ability = defineAbility((allow:any, deny:any) => {
            this.authorizationRules.forEach((rule:CaslRule) => {
                const caslRule:any = [rule.action, rule.subject.toLocaleLowerCase()]

                let isMatchingSubject = false
                let isMatchingAction = false
                let currentRuleSubject = rule.subject.toLocaleLowerCase()
                let currentRuleAction = rule.action.toLocaleLowerCase()

                // determine if rule subject is matching query subject
                if (['all', subjectName.toLocaleLowerCase()].includes(currentRuleSubject)) {
                    isMatchingSubject = true
                }

                // determine if rule action is matching query action
                if (['manage', action.toLocaleLowerCase()].includes(currentRuleAction)) {
                    isMatchingAction = true
                }
                if (!isMatchingAction && typeof actionAliases[currentRuleAction] !== 'undefined') {
                    for (let i = 0; i < actionAliases[currentRuleAction].length; i++) {
                        const alias = actionAliases[currentRuleAction][i]
                        if (alias.toLocaleLowerCase() === action.toLocaleLowerCase()) {
                            isMatchingAction = true
                            break
                        }
                    }
                }

                if (rule.fields && rule.fields.length > 0) {
                    caslRule.push(rule.fields)
                }

                if (rule.condition && keys(rule.condition).length > 0) {
                    caslRule.push(rule.condition)

                    // if action and subject are matching the current query,
                    // then we will auto-fetch the entity based on the condition
                    if (isMatchingSubject && isMatchingAction) {
                        conditionsKeys = conditionsKeys.concat(keys(rule.condition))
                    }
                }

                if (rule.type === 'allow') {
                    if (rule.reason) allow(...caslRule).because(rule.reason)
                    else allow(...caslRule)
                } else if (rule.type === 'deny') {
                    if (rule.reason) deny(...caslRule).because(rule.reason)
                    else deny(...caslRule)
                }
            })
        }, { resolveAction })

        if (this.debug) {
            console.log(
                `Authorization rules applied: `,
                JSON.stringify(ability.rules)
            )
        }

        // generated dynamic subject entity
        let entity = {}
        if (keys(conditionsKeys).length > 0) {
            entity = await this.getAbilitySubjectEntity({ args, model, action, conditionsKeys })
        } else if (this.debug) {
            console.log(`No applicable conditions for the current request.`)
        }

        // return true if action can be performed
        let firstReason:string|boolean = false
        if (fields.length > 0) {
            abilityResult.canProceed = every(
                fields, (field) => {
                    const canProceed = ability.can(
                        action, subject(subjectName.toLocaleLowerCase(), entity), field
                    )
                    const relevantRule = ability.relevantRuleFor(action, entity, field)
                    
                    if (!canProceed && !firstReason) {
                        firstReason = relevantRule && relevantRule.reason
                            ? relevantRule.reason
                            : `Unauthorized, but no reason provided.`
                    }

                    if (this.debug) {
                        console.log(`${canProceed ? 'Allowed' : 'Denied'} operation: "${action}/${subjectName}/${field}"`, JSON.stringify(relevantRule))
                    }
    
                    return canProceed
                }
            )
        } else {
            const canProceed = ability.can(action, subject(subjectName.toLocaleLowerCase(), entity))
            const relevantRule = ability.relevantRuleFor(action, entity)

            if (!canProceed && !firstReason) {
                abilityResult.canProceed = false
                firstReason = relevantRule && relevantRule.reason
                    ? relevantRule.reason
                    : `Unauthorized, but no reason provided.`
            }

            if (this.debug) {
                console.log(
                    `${canProceed ? 'Allowed' : 'Denied'} operation: "${action}/${subjectName}"`,
                    JSON.stringify(relevantRule)
                )
            }
        }

        if (firstReason) abilityResult.reason = firstReason

        return abilityResult
    }

    private async runBeforeResolveHook(
        { operation, model, args }:
        { operation:Operation, model:string, args:RequestProps }
    ) {
        const requestSetPaths = this.getRequestSetPaths({ operation, model, args })
        const fieldsObj = merge({}, args.data || {}, args.select || {}, args.include || {})
        const fields = keys(fieldsObj)
        const subject = operation !== 'custom' ? upperFirst(model) : model

        this.beforeResolveHookProps = {
            authIdentity: this.authIdentity,
            operation: operation,
            subject: subject,
            fields: fields,
            requestSetPaths: requestSetPaths,
            args: args
        }

        if (this.debug) {
            console.log(
                `Running beforeResolve hook on "${operation}/${model}" with params:`, 
                JSON.stringify({
                    authIdentity: this.authIdentity,
                    operation: operation,
                    subject: subject,
                    fields: fields,
                    requestSetPaths: requestSetPaths,
                    args: args
                })
            )
        }

        const beforeResolveHookResult = await this.beforeResolveHook(this.beforeResolveHookProps)

        if (beforeResolveHookResult === false || beforeResolveHookResult === null) {
            throw new UnauthorizedError(`Unauthorized query operation (beforeResolveHook): ${JSON.stringify(requestSetPaths)}`)
        }

        const abilityResult:CaslAbilityResult = await this.isAuthorizedQuery({
            args: args,
            model: model,
            action: operation,
            subjectName: subject,
            fields: fields,
        })

        if (!abilityResult.canProceed) {
            const reason = abilityResult.reason
                ? `Unauthorized query operation: ${abilityResult.reason}`
                : `Unauthorized query operation (allow/deny authorizations): ${JSON.stringify(requestSetPaths)}`

            throw new UnauthorizedError(reason)
        }
    }

    private async runAfterResolveHook({ result }:{ result:any }) {
        const afterResolveHookProps:AfterResolveProps = merge(this.beforeResolveHookProps, { result })

        if (this.debug) {
            console.log(
                `Running afterResolve hook on "${afterResolveHookProps.operation}/${afterResolveHookProps.subject}" with params:`, 
                JSON.stringify({
                    authIdentity: this.authIdentity,
                    operation: afterResolveHookProps.operation,
                    subject: afterResolveHookProps.subject,
                    fields: afterResolveHookProps.fields,
                    requestSetPaths: afterResolveHookProps.requestSetPaths,
                    args: afterResolveHookProps.args,
                    result: afterResolveHookProps.result
                })
            )
        }

        const afterResolveHookResult = await this.afterResolveHook(afterResolveHookProps)

        if (afterResolveHookResult === false || afterResolveHookResult === null) {
            throw new UnauthorizedError(`Unauthorized query operation (afterResolveHook): ${JSON.stringify(afterResolveHookProps.requestSetPaths)}`)
        }
    }

    public setAuthIdentity(
        { authIdentityType, authIdentityObj }:
        { authIdentityType:AuthType, authIdentityObj:any }
    ) {
        this.authIdentity = merge(authIdentityObj, {
            authorization: authIdentityType,
        })

        if (this.debug) {
            console.log('Auth. identity output: ', JSON.stringify(this.authIdentity))
        }

        return this
    }

    public setBeforeResolveHook(callbackFunc:Function) {
        this.beforeResolveHook = callbackFunc

        return this
    }

    public setAfterResolveHook(callbackFunc:Function) {
        this.afterResolveHook = callbackFunc

        return this
    }

    public addAuthorizationRule(authorizationRule:CaslRule) {
        this.authorizationRules.push(authorizationRule)

        return this
    }

    public async custom(model:string, args:RequestProps, callback:Function) {
        await this.runBeforeResolveHook({ operation: Operations.custom, model, args })

        const callbackProps:CustomResolverProps = {
            args: args,
            authIdentity: this.authIdentity
        }

        const results = await callback(callbackProps)

        await this.runAfterResolveHook({ result: results })

        return results
    }
    
    public async get(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.get, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].findUnique({
            where: args.where,
            ...(args.select && {select: args.select})
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async list(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.list, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].findMany({
            ...(args.where && {where: args.where}),
            ...(args.orderBy && {orderBy: args.orderBy}),
            ...(args.select && {select: args.select})
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async create(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.create, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].create({
            data: args.data,
            ...(args.select && {select: args.select}),
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async update(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.update, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].update({
            data: args.data,
            where: args.where,
            ...(args.select && {select: args.select}),
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async upsert(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.upsert, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].upsert({
            update: args.data,
            create: args.data,
            where: args.where,
            ...(args.select && {select: args.select}),
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async delete(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.delete, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].delete({
            where: args.where,
            ...(args.select && {select: args.select}),
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }

    public async deleteMany(model:string, args:RequestProps) {
        await this.runBeforeResolveHook({ operation: Operations.deleteMany, model, args })

        if (process.env.JEST_WORKER_ID) return args

        const results = await this.prisma[model].deleteMany({
            where: args.where
        })

        await this.runAfterResolveHook({ result: results })

        return results
    }
}