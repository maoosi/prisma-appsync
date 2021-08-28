// @ts-ignore: has no exported member 'Prisma'
import { PrismaClient, Prisma } from '@prisma/client'
import { CustomPrismaClientOptions } from './_types'

export class CustomPrismaClient extends PrismaClient<Prisma.PrismaClientOptions, 'query'> {
    constructor({ connectionUrl, debug }:CustomPrismaClientOptions) {
        process.env.CHECKPOINT_DISABLE = '1'
        process.env.DATABASE_URL = connectionUrl

        super({
            log: [ { emit: 'event', level: 'query' } ],
            errorFormat: 'pretty',
        })

        if (debug) {
            this.$on('query', (log:any) => {
                console.log('MySQL query: ', JSON.stringify(log))
            })
        }

        return this
    }
}