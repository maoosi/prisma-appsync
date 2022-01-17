import { getShieldAuthorization } from '../../packages/client/guard'
import { Actions, ActionsAliases } from '../../packages/client/defs'
import { Prisma } from '@prisma/client'

const Models = Prisma.ModelName

process.env.PRISMA_APPSYNC_TESTING = 'true'

describe('CLIENT #guard', () => {
    describe('.getShieldAuthorization?', () => {
        test('expect query to be _denied_ by default', () => {
            const authorization = getShieldAuthorization({
                shield: { '**': false },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _denied_ when ** is false', () => {
            const authorization = getShieldAuthorization({
                shield: { '**': false },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _allowed_ when ** is true', () => {
            const authorization = getShieldAuthorization({
                shield: { '**': true },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: **',
                matcher: '**',
                globPattern: '**',
                prismaFilter: {},
            })
        })

        test('expect query to be _denied_ when custom rule overrides **', () => {
            const authorization = getShieldAuthorization({
                shield: {
                    '**': true,
                    '/modify/{post,comment,user}{,/**}': {
                        rule: false,
                        reason: ({ model }) => `${model} can only be modified by its owner.`,
                    },
                },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Post can only be modified by its owner.',
                matcher: '/modify/{post,comment,user}{,/**}',
                globPattern: '/{upsert,update,updateMany,delete,deleteMany}/{post,comment,user}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be _allowed_ when custom rule overrides **', () => {
            const authorization = getShieldAuthorization({
                shield: {
                    '**': false,
                    '/modify/{post,comment,user}{,/**}': { rule: true },
                },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: /modify/{post,comment,user}{,/**}',
                matcher: '/modify/{post,comment,user}{,/**}',
                globPattern: '/{upsert,update,updateMany,delete,deleteMany}/{post,comment,user}{,/**}',
                prismaFilter: {},
            })
        })

        test('expect query to be a _prismaFilter_ when rule is an object', () => {
            const isOwner = { owner: { cognitoSub: 'xxx' } }

            const authorization = getShieldAuthorization({
                shield: {
                    '**': false,
                    '/modify/{post,comment,user}{,/**}': { rule: isOwner },
                },
                paths: ['/update/post/title'],
                context: {
                    action: Actions.update,
                    alias: ActionsAliases.modify,
                    model: Models.Post,
                },
            })

            expect(authorization).toEqual({
                canAccess: true,
                reason: 'Matcher: /modify/{post,comment,user}{,/**}',
                matcher: '/modify/{post,comment,user}{,/**}',
                globPattern: '/{upsert,update,updateMany,delete,deleteMany}/{post,comment,user}{,/**}',
                prismaFilter: isOwner,
            })
        })
    })
})
