// import { Shield, ActionsAliases, Models, Subject, Model, ActionsAlias } from './defs'
// import { getDirectiveParam } from './_shield'


describe('CLIENT #shield', () => {

    describe('.getApplicableRules?', () => {

        /*
            mutation updatePost(
                where: { postId: 2 }
                data: {
                    title: "New title",
                    author: {
                        connect: {
                            username: "other user"
                        }
                    }
                }
            ) {
                title
                comments {
                    content
                    author {
                        email
                        username
                        badges {
                            label
                            owners {
                                email
                            }
                        }
                    }
                }
            }

            paths = [
                "modify/post/title",
                "modify/post/author",
                "modify/post/author/username",
                "access/title",
                "access/title/comment",
                "access/title/comment/content",
                "access/title/comment/author",
                "access/title/comment/author/email",
                "access/title/comment/author/username",
                "access/title/comment/author/badges",
                "access/title/comment/author/badges/label",
                "access/title/comment/author/badges/owners",
                "access/title/comment/author/badges/owners/email",
            ]
        */

        const paths = [
            "/update/post/title",
            "/update/post/author",
            "/update/post/author/username",
            "/access/title",
            "/access/comment",
            "/access/comment/content",
            "/access/comment/author",
            "/access/comment/author/email",
            "/access/comment/author/username",
            "/access/comment/author/badges",
            "/access/comment/author/badges/label",
            "/access/comment/author/badges/owners",
            "/access/comment/author/badges/owners/email",
        ]

        const shield = ({ isOwner, isAdmin }) => {
            return {
                '**': false,

                '/access/**/!(email|username)': {
                    rule: true,
                    reason: () => 'Fields email and username are not accessible via n+1.'
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
            const canAccess = 
            expect(allowed).toEqual(false)
        })

    })

})

// const emulateShield = (
//     { type, fields }: { type: 'visitor' | 'user' | 'owner' | 'admin', fields?: string[] }
// ): Shield => {
//     const { Post, User } = Models

//     const isUser = type === 'user'
//     const isAdmin = type === 'admin'
//     const isOwner = type === 'owner'
//     const isSecretUserField = fields && fields.includes('secret')

//     return {
//         '*': {
//             rule: false,

//             [ActionsAliases.access]: {
//                 rule: isUser
//             },
//             [ActionsAliases.batchDelete]: {
//                 rule: isAdmin && !isSecretUserField
//             },
//         },
//         customResolvers: {
//             'incrementViews': {
//                 rule: isAdmin
//             }
//         },
//         [Post]: {
//             rule: isUser,

//             [ActionsAliases.modify]: {
//                 rule: isOwner
//             },
//             [ActionsAliases.delete]: {
//                 rule: isAdmin
//             }
//         },
//         [User]: {
//             [ActionsAliases.access]: {
//                 rule: isOwner || isAdmin
//             },
//             [ActionsAliases.batchAccess]: {
//                 rule: isAdmin
//             },
//             [ActionsAliases.modify]: {
//                 rule: isAdmin && !isSecretUserField
//             },
//         }
//     }
// }


// describe('CLIENT #shield', () => {

//     describe('.getDirectiveParam.rule?', () => {

//         test('expect modify(User) to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.modify
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect modify(User, [`secret`]) to be _denied_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin', fields: ['secret'] }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.modify
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect modify(User) to be _denied_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.modify
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect access(User) to be _allowed_ as `owner`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'owner' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.access
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect access(User) to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.access
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect batchAccess(User) to be _denied_ as `owner`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'owner' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.batchAccess
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect batchAccess(User) to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), {
//                 model: Models.User,
//                 actionAlias: ActionsAliases.batchAccess
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect delete(Post) to be _denied_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), {
//                 model: Models.Post,
//                 actionAlias: ActionsAliases.delete
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect delete(Post) to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), {
//                 model: Models.Post,
//                 actionAlias: ActionsAliases.delete
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect batchDelete(Post, [`secret`]) to be _denied_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin', fields: ['secret'] }), {
//                 model: Models.Post,
//                 actionAlias: ActionsAliases.batchDelete
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect access(Post) to be _allowed_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), {
//                 model: Models.Post,
//                 actionAlias: ActionsAliases.access
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect access(hiddenModel) to be _denied_ as `visitor`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'visitor' }), {
//                 model: Models.hiddenModel,
//                 actionAlias: ActionsAliases.access
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect access(hiddenModel) to be _allowed_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), {
//                 model: Models.hiddenModel,
//                 actionAlias: ActionsAliases.access
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect batchDelete(hiddenModel) to be _denied_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), {
//                 model: Models.hiddenModel,
//                 actionAlias: ActionsAliases.batchDelete
//             }, 'rule')
//             expect(allowed).toEqual(false)
//         })

//         test('expect batchDelete(hiddenModel) to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), {
//                 model: Models.hiddenModel,
//                 actionAlias: ActionsAliases.batchDelete
//             }, 'rule')
//             expect(allowed).toEqual(true)
//         })
        
//         test('expect custom.incrementViews to be _allowed_ as `admin`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'admin' }), 'incrementViews', 'rule')
//             expect(allowed).toEqual(true)
//         })

//         test('expect custom.incrementViews to be _denied_ as `user`', () => {
//             const allowed = getDirectiveParam(emulateShield({ type: 'user' }), 'incrementViews', 'rule')
//             expect(allowed).toEqual(false)
//         })
//     })
    
// })