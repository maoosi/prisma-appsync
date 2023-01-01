import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, test } from 'vitest'
import EasyGraphQLTester from 'easygraphql-tester'

const appsyncDirectives = readFileSync(join(__dirname, '../../packages/server/src/gql/appsync-directives.gql'), 'utf8')
const appsyncScalars = readFileSync(join(__dirname, '../../packages/server/src/gql/appsync-scalars.gql'), 'utf8')
const gqlSchema = readFileSync(join(__dirname, '../prisma/generated/prisma-appsync/schema.gql'), 'utf8')

const schema = String([appsyncDirectives, appsyncScalars, gqlSchema].join('\n\n').replace(/\"\"\"(.|\n)*?\"\"\"\n/gim, ''))
const tester = new EasyGraphQLTester(schema)

describe('GENERATOR #gql', () => {
    describe('.basicOperations?', () => {
        test('expect get<Model> query to exist, with the right params', async () => {
            const query = `
                query ($id: Int!) {
                    getPost(where: { id: $id }) {
                        id
                        title
                        authorUuid
                        published
                        views
                        lastSavedAt
                    }
                }
            `
            tester.test(true, query, { id: 1 })
        })
    })
    describe('.advancedOperations?', () => {
        test('expect custom resolver query to exist, with the right params', async () => {
            const query = `
                mutation ($message: String!) {
                    notify(message: $message) {
                        message
                    }
                }
            `
            tester.test(true, query, { message: 'Hello world' })
        })
    })
})
