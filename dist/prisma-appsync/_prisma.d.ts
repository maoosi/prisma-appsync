import { PrismaClient, Prisma } from '@prisma/client';
import { CustomPrismaClientOptions } from './_types';
export declare class CustomPrismaClient extends PrismaClient<Prisma.PrismaClientOptions, 'query'> {
    constructor({ connectionUrl, debug }: CustomPrismaClientOptions);
}
