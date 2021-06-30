import { ShieldDirectives, ActionsAliases, Models } from './defs'
import { getDirectiveParam } from './_shield'


describe('CLIENT #shield', () => {

    describe('.getDirectiveParam?', () => {
        const cases = []
        const models = [null].concat( Object.keys(Models) )
        const actions = [null].concat( Object.keys(ActionsAliases) )
        const params = ['rule', 'filter', 'afterResolve']
        const isParamDefined = [true, false]

        isParamDefined.forEach((isParamDefined:boolean) => {
            params.forEach((param:string) => {
                models.forEach((model:string | null) => {
                    actions.forEach((action:string | null) => {
                        let subject:any = String()
                        let shield:ShieldDirectives = {}
                        let expected = String()
                        let target = String()

                        if (model && action) {
                            subject = { model: model, action: action }
                        } else if (model) {
                            subject = { model: model }
                        } else {
                            subject = { model: 'custom', action: 'myCustomQuery' }
                        }

                        if (isParamDefined && subject.action) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [param]: `return parent model`,
                                    [subject.action]: {
                                        [param]: `return action`
                                    }
                                }
                            }
                            target = `${subject.model} > ${subject.action} (action)`
                            expected = `return action`
                        } else if (isParamDefined && !subject.action) {
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
                        } else if (!isParamDefined && subject.action) {
                            shield = {
                                '*': {
                                    [param]: `return *`
                                },
                                [subject.model]: {
                                    [param]: `return parent model`,
                                    [subject.action]: {}
                                }
                            }
                            target = `${subject.model} > ${subject.action} (action)`
                            expected = `return parent model`
                        } else if (!isParamDefined && !subject.action) {
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