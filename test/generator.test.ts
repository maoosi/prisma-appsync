import { readFileSync } from 'fs' 
import { join } from 'path'

describe('Generator', () => {
    test('Should extend default AppSync schema with custom schema', () => {
        const schema = readFileSync(
            join(__dirname, 'generated/prisma-appsync/schema.gql'), 'utf8'
        )
        expect(/notify\(message\: String\!\)\: PublishNotification/.test(schema)).toBe(true)
    })
    test('Ignored fields should not appear in the Schema output', () => {
        const schema = readFileSync(
            join(__dirname, 'generated/prisma-appsync/schema.gql'), 'utf8'
        )
        expect(/hiddenField/.test(schema)).toBe(false)
    })
    test('Ignored models should not appear in the Schema output', () => {
        const schema = readFileSync(
            join(__dirname, 'generated/prisma-appsync/schema.gql'), 'utf8'
        )
        expect(/hiddenModel/.test(schema)).toBe(false)
    })
})