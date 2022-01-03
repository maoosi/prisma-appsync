import { Shield } from 'packages/client/defs'
import { getShieldAuthorization } from 'packages/client/guard'

describe('CLIENT #guard', () => {
    // TODO: write more test cases
    describe('.getShieldAuthorization?', () => {
        const paths = [
            '/update/post/title',
            '/update/post/author/username',
            '/get/post/title',
            '/get/post/comment/content',
            '/get/post/comment/author/email',
            '/get/post/comment/author/username',
            '/get/post/comment/author/badges/label',
            '/get/post/comment/author/badges/owners/email',
        ]

        const createShield = ({ isOwner, isAdmin }): Shield => {
            return {
                '**': false,

                '/access/**/!(email|username)': {
                    rule: true,
                    reason: () => 'Fields email and username are not accessible via n+1.',
                },

                '/modify/{post,comment,user}{,/*}': {
                    rule: isOwner,
                    reason: ({ model }) => `${model} can only be modified by their owner.`,
                },

                '/modify/{post,comment,user}{,/**}': {
                    rule: isAdmin,
                    reason: () => 'Field password is not accessible.',
                },
            }
        }

        test('expect query to be _denied_ by default', () => {
            const authorization = getShieldAuthorization({
                shield: createShield({ isOwner: false, isAdmin: false }),
                paths: paths,
            })

            expect(authorization).toEqual({
                canAccess: false,
                reason: 'Matcher: **',
                matcher: '**',
                prismaFilter: null,
            })
        })
    })
})
