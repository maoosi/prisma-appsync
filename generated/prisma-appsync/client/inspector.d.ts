declare const errorCodes: {
    FORBIDDEN: number;
    BAD_USER_INPUT: number;
    INTERNAL_SERVER_ERROR: number;
    TOO_MANY_REQUESTS: number;
};
declare type ErrorExtensions = {
    type: keyof typeof errorCodes;
    trace?: string[];
    [key: string]: any;
};
declare type ErrorDetails = {
    error: string;
    type: ErrorExtensions['type'];
    code: number;
    trace: ErrorExtensions['trace'];
};
export declare class CustomError extends Error {
    error: ErrorDetails['error'];
    type: ErrorDetails['type'];
    code: ErrorDetails['code'];
    trace: ErrorDetails['trace'];
    details: ErrorDetails;
    constructor(message: string, extensions: ErrorExtensions);
}
export declare function parseError(error: Error): CustomError;
export declare function inspect(data: any): string;
export declare function debug(...data: any[]): void;
export declare function log(data: any, level?: 'ERROR' | 'WARN' | 'INFO'): void;
export {};
