import { PrismaAppSyncAdapter } from './_adapter';
import { PrismaAppSyncResolver } from './_resolver';
import { Options, AdapterOptions, RequestProps, AuthType, AuthIdentityProps, AuthRule, CustomResolverProps, AfterResolveProps, BeforeResolveProps } from './_types';
import { AuthModes, Operations, AuthActions } from './_constants';
export { PrismaAppSyncAdapter, PrismaAppSyncResolver, Options, AdapterOptions, RequestProps, AuthType, AuthIdentityProps, AuthRule, CustomResolverProps, AfterResolveProps, BeforeResolveProps, AuthModes, Operations, AuthActions };
export declare class PrismaAppSync {
    adapter: PrismaAppSyncAdapter;
    resolver: PrismaAppSyncResolver;
    private options;
    constructor(options: Options);
    parseEvent(event: any): this;
    sanitize(data: any): any;
    allow(authorizationRule: AuthRule): void;
    deny(authorizationRule: AuthRule): void;
    private addAuthorizationRule;
    private experimentalDateTimeFieldsRegex;
    resolve(): Promise<any>;
    beforeResolve(callbackFunc: Function): this;
    afterResolve(callbackFunc: Function): this;
    $disconnect(): Promise<any>;
}
