/* eslint-disable unicorn/prefer-node-protocol */
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, test } from 'vitest'
import EasyGraphQLTester from 'easygraphql-tester'
import { makeExecutableSchema } from '@graphql-tools/schema'

const appsyncDirectives = readFileSync(join(__dirname, './mock/appsync-directives.gql'), 'utf8')
const appsyncScalars = readFileSync(join(__dirname, './mock/appsync-scalars.gql'), 'utf8')
const generatedSchema = readFileSync(join(__dirname, './schemas/generated/@gql/schema.gql'), 'utf8')
const appsyncSchema = [appsyncDirectives, appsyncScalars, generatedSchema].join('\n\n').replace(/\"\"\"(.|\n)*?\"\"\"\n/gim, '')
const gqlSchema = makeExecutableSchema({ typeDefs: appsyncSchema })
const tester = new EasyGraphQLTester(appsyncSchema)

describe('GENERATOR @gql', () => {
    describe('disabling entire models', () => {
        test('expect Badge queries to be disabled', async () => {
            const invalidQuery = 'query { getBadge { level } }'
            tester.test(false, invalidQuery)
        })
        test('expect Badge mutations to be disabled', async () => {
            const invalidQuery = `
                mutation {
                    createBadge(
                        data: { level: 1, rank: 1 }
                    ) {
                        level
                        rank
                    }
                }`
            tester.test(false, invalidQuery)
        })
    })

    describe('disabling top-level queries, mutations, subscriptions', () => {
        test('expect User queries to be enabled', async () => {
            const query = 'query { listUsers { email } }'
            tester.test(true, query)
        })
        test('expect User subscriptions to be disabled', async () => {
            const invalidQuery = `subscription { onMutatedUser {  id } }`
            tester.test(false, invalidQuery)
        })
    })

    describe('disabling granular operations', () => {
        test('expect create Post to be enabled', async () => {
            const query = `
                mutation {
                    createPost(
                        data: { title: "title" }
                    ) {
                        title
                    }
                }`
            tester.test(true, query)
        })
        test('expect delete Post to be disabled', async () => {
            const invalidQuery = `
                mutation {
                    deletePost(
                        where: { id: 1 }
                    ) {
                        title
                    }
                }`
            tester.test(false, invalidQuery)
        })
    })

    describe('hidding fields', () => {
        test('expect querying password field on User to fail', async () => {
            const invalidQuery = 'query { listUsers { password } }'
            tester.test(false, invalidQuery)
        })
        test('expect querying other fields on User to succeed', async () => {
            const query = 'query { listUsers { email } }'
            tester.test(true, query)
        })
        test('expect password field to still be writable', async () => {
            const query = `mutation {
                createUser (
                    data: {
                        email: "user@email.com"
                        password: "123456"
                    }
                ) {
                    email
                }
            }`
            tester.test(true, query)
        })
    })

    describe('custom scalars', () => {
        test('expect source field on Post to be "AWSURL"', async () => {
            const postType: any = gqlSchema.getType('Post')
            const sourceField = postType.getFields()?.source
            const sourceFieldScalar = sourceField?.type?.toString()
            expect(sourceFieldScalar).toEqual('AWSURL')
        })
    })
})
