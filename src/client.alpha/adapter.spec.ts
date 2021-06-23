import { getAction, getOperation, getModel, getFields, getType } from './adapter'
import { Actions, Action } from './defs'

describe('CLIENT #adapter', () => {

    describe('.getOperation?', () => {
        const cases = Object.keys(Actions).map((action:Action) => {
            return [`${action}People`, `${action}People`]
        })
        test.each(cases)(
            'when fieldName is %s, expect action to be %s',
            (fieldName, expected) => {
                const result = getOperation({ fieldName })
                expect(result).toEqual(expected)
            }
        )
    })

    describe('.getAction?', () => {
        const cases = Object.keys(Actions).map((action:Action) => {
            return [`${action}People`, action]
        })
        test.each(cases)(
            'when operation is %s, expect action to be %s',
            (operation, expected) => {
                const result = getAction({ operation })
                expect(result).toEqual(expected)
            }
        )
    })

    describe('.getModel?', () => {
        const cases = Object.keys(Actions).map((action:Action) => {
            return [action, 'People']
        })
        test.each(cases)(
            'when operation is %sPeople, expect model to be %s',
            (action: Action, expected) => {
                const result = getModel({ operation: `${action}People`, action: action })
                expect(result).toEqual(expected)
            }
        )
    })

    describe('.getFields?', () => {
        test('expect to extract all first level fields', () => {
            const result = getFields({
                _selectionSetList: [
                    '__typename',
                    'title',
                    'description',
                    'author',
                    'author/username',
                    'author/email',
                    'author/comments',
                    'author/comments/text',
                    'author/comments/likes',
                    'author/comments/likes/user',
                    'author/comments/likes/user/username',
                ]
            })
            expect(result).toEqual([
                'title',
                'description',
                'author'
            ])
        })
    })

    describe('.getType?', () => {
        test('expect type to be Query', () => {
            const result = getType({ _parentTypeName: 'Query' })
            expect(result).toEqual('Query')
        })
        test('expect type to be Mutation', () => {
            const result = getType({ _parentTypeName: 'Mutation' })
            expect(result).toEqual('Mutation')
        })
        test('expect type to be Subscription', () => {
            const result = getType({ _parentTypeName: 'Subscription' })
            expect(result).toEqual('Subscription')
        })
        test('when wrong _parentTypeName, expect to throw Error()', () => {
            expect(() => getType({ _parentTypeName: 'User' })).toThrow(Error)
        })
    })

    describe('.getArgs?', () => {})
    
})