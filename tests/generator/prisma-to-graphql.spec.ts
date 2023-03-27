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
        test('expect "get<Model>" query to be valid', async () => {
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
        test('expect "list<Model>" query to be valid', async () => {
            const query = `
                query {
                    listUsers {
                        uuid
                        username
                        email
                        role
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "count<Model>" query to be valid', async () => {
            const query = `
                query {
                    countUsers
                }
            `
            tester.test(true, query)
        })
        test('expect "create<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    createPost(
                        data: { title: "Hello world" }
                    ) {
                        title
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "update<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    updatePost(
                        where: { id: 1 }
                        data: { title: "Hello world" }
                    ) {
                        title
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "upsert<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    upsertPost(
                        where: { id: 1 }
                        create: { title: "Hello world" }
                        update: { title: "Hello world" }
                    ) {
                        title
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "delete<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    deletePost(
                        where: { id: 1 }
                    ) {
                        title
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "createMany<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    createManyPosts(
                        data: [
                            { title: "Hello world 1" },
                            { title: "Hello world 2" }
                        ]
                    ) {
                        count
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "updateMany<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    updateManyPosts(
                        where: { title: { equals: "Hello" } }
                        data: { title: "Hello world" }
                    ) {
                        count
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "deleteMany<Model>" query to be valid', async () => {
            const query = `
                mutation {
                    deleteManyPosts(
                        where: { title: { equals: "Hello world" } }
                    ) {
                        count
                    }
                }
            `
            tester.test(true, query)
        })
    })
    describe('.advancedOperations?', () => {
        test('expect "deeply nested read" query to be valid', async () => {
            const query = `
                query {
                    listUsers {
                        uuid
                        username
                        email
                        role

                        posts {
                            id
                            title
                            authorUuid
                            published
                            views
                            lastSavedAt
                            
                            comments {
                                id
                                message
                                lastSavedAt
                            }
                        }
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "nested write" query to be valid', async () => {
            const query = `
                mutation {
                    createUser(
                        data: {
                            username: "username"
                            email: "email@gmail.com"

                            posts: {
                                create: [
                                    {
                                        id: 1
                                        title: "Post 1" 
                                    },
                                    { 
                                        id: 2
                                        title: "Post 2"
                                    }
                                ]
                            }
                        }
                    ) {
                        uuid
                        username
                        email
                        role

                        posts {
                            id
                            title
                            authorUuid
                            published
                            views
                            lastSavedAt
                        }
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "relation to-one filter" query to be valid', async () => {
            const query = `
                query {
                    listComments(
                        where: {
                            author: {
                                username: {
                                    equals: "username"
                                }
                            }
                        }
                    ) {
                        message
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "relation to-many filter" query to be valid', async () => {
            const query = `
                query {
                    listUsers(
                        where: {
                            posts: {
                                every: {
                                    published: {
                                        equals: true
                                    }
                                }
                            }
                        }
                    ) {
                        username
                        email
                        role
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "deeply nested relation to-one-to-many filter" query to be valid', async () => {
            const query = `
                query {
                    listComments(
                        where: {
                            author: {
                                posts: {
                                    every: {
                                        published: { equals: true }
                                    }
                                }
                            }
                        }
                    ) {
                        message
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "deeply nested relation to-many-to-many filter" query to be valid', async () => {
            const query = `
                query {
                    listUsers(
                        where: {
                            posts: {
                                every: {
                                    comments: {
                                        every: {
                                            message: { startsWith: "hello" }
                                        }
                                    }
                                }
                            }
                        }
                    ) {
                        username
                        email
                        role
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "deeply nested relation to-one-to-one filter" query to be valid', async () => {
            const query = `
                query {
                    listComments(
                        where: {
                            author: {
                                profile: {
                                    bio: { contains: "hello" }
                                }
                            }
                        }
                    ) {
                        message
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "deeply nested relation to-many-to-one filter" query to be valid', async () => {
            const query = `
                query {
                    listUsers(
                        where: {
                            posts: {
                                every: {
                                    author: {
                                        username: {
                                            equals: "username"
                                        }
                                    }
                                }
                            }
                        }
                    ) {
                        username
                        email
                        role
                    }
                }
            `
            tester.test(true, query)
        })
        test('expect "custom resolver" query to be valid', async () => {
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
