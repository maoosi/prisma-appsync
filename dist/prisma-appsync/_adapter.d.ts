import { RequestProps, AdapterOptions, AuthType, Operation } from './_types';
export declare class PrismaAppSyncAdapter {
    private customResolvers;
    private debug;
    private defaultPagination;
    operation: Operation;
    model: string;
    args: RequestProps;
    requestSetPaths: string[];
    authIdentityType: AuthType;
    authIdentityObj: any;
    constructor(event: any, options: AdapterOptions);
    private detectCallerIdentity;
    private verifyIntegrity;
    private parseRequest;
    private parseArgs;
    private getInclude;
    private getSelect;
    private parseSelectionList;
    private parseOrderBy;
}
