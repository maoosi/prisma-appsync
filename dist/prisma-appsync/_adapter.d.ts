import { RequestProps, PrivateOptions, AuthType } from './_types';
export declare class PrismaAppSyncAdapter {
    private customResolvers;
    private debug;
    operation: string;
    model: string;
    args: RequestProps;
    requestSetPaths: string[];
    authIdentityType: AuthType;
    authIdentityObj: any;
    constructor(event: any, options?: PrivateOptions);
    private detectCallerIdentity;
    private verifyIntegrity;
    private parseRequest;
    private parseArgs;
    private getInclude;
    private getSelect;
    private parseSelectionList;
    private parseData;
    private parseWhere;
    private parseOrderBy;
}
