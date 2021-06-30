import { ShieldDirectives, ActionsAliases, Models, ShieldSubject, Model, ActionsAlias } from './defs'
import { getDirectiveParam } from './_shield'


describe('CLIENT #shield', () => {

    describe('.getDirectiveParam?', () => {
        const cases = []
        const models = [null].concat( Object.keys(Models) )
        const actions = [null].concat( Object.keys(ActionsAliases) )
        const params = ['rule', 'filter', 'afterResolve', 'afterResolve']
        const isParamDefined = [true, false]

        isParamDefined.forEach((isParamDefined:boolean) => {
            params.forEach((param:string) => {
                models.forEach((model:Model | null) => {
                    actions.forEach((action:ActionsAlias | null) => {
                        let subject:ShieldSubject
                        let shield:ShieldDirectives = {}
                        let expected = String()
                        let target = String()

                        if (model && action) {
                            subject = { model: model, actionAlias: action }
                        } else if (model) {
                            subject = { model: model, actionAlias: `` }
                        } else {
                            subject = { model: 'custom', actionAlias: 'myCustomQuery' }
                        }

                        if (isParamDefined && subject.actionAlias) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [param]: `return parent model`,
                                    [subject.actionAlias]: {
                                        [param]: `return action`
                                    }
                                }
                            }
                            target = `${subject.model} > ${subject.actionAlias} (action)`
                            expected = `return action`
                        } else if (isParamDefined && !subject.actionAlias) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [param]: `return model`,
                                }
                            }
                            target = `${subject.model} (model)`
                            expected = `return model`
                        } else if (!isParamDefined && subject.actionAlias) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [param]: `return parent model`,
                                    [subject.actionAlias]: {}
                                }
                            }
                            target = `${subject.model} > ${subject.actionAlias} (action)`
                            expected = `return parent model`
                        } else if (!isParamDefined && !subject.actionAlias) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [action]: {}
                                }
                            }
                            target = `${subject.model} (model)`
                            expected = `return *`
                        }

                        const testCase = 
                            `when param "${param}" ${isParamDefined ? 'exists' : 'doesn\'t exist'} on "${target}", ${expected} ${param}`

                        cases.push(
                            [testCase, shield, subject, param, expected]
                        )
                    })  
                })  
            })
        })

        test.each(cases)(
            '%s',
            (testCase, shield, subject, param, expected) => {
                const result = getDirectiveParam(
                    shield,
                    subject,
                    param,
                )
                expect(result).toEqual(expected)
            }
        )
    })
    
})