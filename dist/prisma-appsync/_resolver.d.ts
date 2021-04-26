import { RequestProps, AuthType, CaslRule, ResolverOptions } from './_types';
export declare class PrismaAppSyncResolver {
    private debug;
    private authIdentity;
    private beforeResolveHook;
    private beforeResolveHookProps;
    private afterResolveHook;
    private prisma;
    private authorizationRules;
    constructor(options: ResolverOptions);
    private getRequestSetPaths;
    private getAbilitySubjectEntity;
    private isAuthorizedQuery;
    private runBeforeResolveHook;
    private runAfterResolveHook;
    setAuthIdentity({ authIdentityType, authIdentityObj }: {
        authIdentityType: AuthType;
        authIdentityObj: any;
    }): this;
    setBeforeResolveHook(callbackFunc: Function): this;
    setAfterResolveHook(callbackFunc: Function): this;
    addAuthorizationRule(authorizationRule: CaslRule): this;
    custom(model: string, args: RequestProps, callback: Function): Promise<any>;
    get(model: string, args: RequestProps): Promise<any>;
    list(model: string, args: RequestProps): Promise<any>;
    create(model: string, args: RequestProps): Promise<any>;
    update(model: string, args: RequestProps): Promise<any>;
    upsert(model: string, args: RequestProps): Promise<any>;
    delete(model: string, args: RequestProps): Promise<any>;
    deleteMany(model: string, args: RequestProps): Promise<any>;
}
