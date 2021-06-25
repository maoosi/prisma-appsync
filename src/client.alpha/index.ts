import { AppsyncEvent, ResolverQuery, Action, Actions, Model, Models, Args } from './defs'

export class PrismaAppSync {

    constructor(options:PrismaAppSyncOptions) {
        
    }

    // public function resolve() {

    // }

    // public function createEvent() {

    // }

}

type PrismaAppSyncOptions = {
    event: any,
    customResolvers?: {},
    beforeResolve?: () => Promise<void>
    afterResolve?: () => Promise<void>
    shield?: () => Promise<Shield>
}

export type ShieldDirective = {
    rule?: Boolean
    filter?: Promise<boolean>
    afterResolve?: () => Promise<void>
}


export interface Shield {
    [key in Model]: {
        [key in Action]: ShieldDirective
    }
}

const shield:Shield = {
    2: {
        glut: 'xxx'
    }
}



// // init prisma-appsync client
// const prismaAppSync = new PrismaAppSync({
//     connectionString: process.env.DATABASE_URL
// })

// // direct lambda resolver for appsync
// export const resolver = async (event: any, context: any) => {
//     // extend CRUD API with a custom query
//     const myCustomQuery = async ({ prismaClient }) => {
//         return await prismaClient.post.count()
//     }

//     // resolve api request
//     return await prismaAppSync.resolve({
//         event: event, // AppSync event
//         customResolvers: { myCustomQuery },
//         beforeResolve: () => true,
//         afterResolve: ({ result }) => console.log({ result }),
//         shield: ({ authIdentity, actions, models }) => {
//             const isDefaultAllowed = false
//             const isOwner = { owner: { cognitoSub: authIdentity.sub } }
//             const isAdmin = authIdentity.groups.includes('admin')

//             return {
//                 '*': {
//                     [actions.all]: {
//                         rule: isDefaultAllowed
//                     },
//                 },
//                 [models.Post]: {
//                     [actions.access]: {
//                         // filter out the field 'secret' from the API response
//                         filter: ({ field }) => !['secret'].includes(field),
//                     },
//                     [actions.modify]: {
//                         rule: isOwner,
//                         reason: 'Posts can only be modified by their owner.',
//                         afterResolve: async ({ result }) => {

//                             // Trigger something else after Post is modified
//                             await prismaAppSync.resolve({
//                                 event: prismaAppSync.createEvent({
//                                     subject: {
//                                         model: models.Activity, 
//                                         action: actions.create,
//                                     },
//                                     args: {
//                                         data: {
//                                             event: 'POST_CREATED', 
//                                             data: JSON.stringify(result)
//                                         }
//                                     }
//                                 })
//                             })

//                         }
//                     }
//                 },
//                 'myCustomQuery': {
//                     rule: isAdmin,
//                     reason: 'myCustomQuery is reserved to admins.',
//                 }
//             }
//         },
//     })
// }