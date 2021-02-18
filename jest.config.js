module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '\\.(gql|graphql)$': 'jest-transform-graphql'
    }
}
