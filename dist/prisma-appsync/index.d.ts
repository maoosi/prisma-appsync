import { PrismaClient } from '@prisma/client';
import { PrismaAppSyncAdapter } from './_adapter';
import { PrismaAppSyncResolver } from './_resolver';
import { Options, RequestProps, AuthType, AuthIdentityProps, AuthRule, CustomResolverProps, AfterResolveProps, BeforeResolveProps } from './_types';
import { AuthModes, Operations, AuthActions } from './_constants';
export { PrismaAppSyncAdapter, PrismaAppSyncResolver, Options, RequestProps, AuthType, AuthIdentityProps, AuthRule, CustomResolverProps, AfterResolveProps, BeforeResolveProps, AuthModes, Operations, AuthActions };
export declare class PrismaAppSync {
    adapter: PrismaAppSyncAdapter;
    resolver: PrismaAppSyncResolver;
    prisma: PrismaClient;
    private customResolvers;
    private options;
    constructor(options: Options);
    registerCustomResolvers(customResolvers: any): this;
    parseEvent(event: any): this;
    sanitize(data: any): any;
    allow(authorizationRule: AuthRule): void;
    deny(authorizationRule: AuthRule): void;
    private addAuthorizationRule;
    resolve(): Promise<any>;
    beforeResolve(callbackFunc: Function): this;
    afterResolve(callbackFunc: Function): this;
}
