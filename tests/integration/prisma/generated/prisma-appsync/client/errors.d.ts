declare type ErrorExtensions = {
    code: 'FORBIDDEN' | 'BAD_USER_INPUT' | 'INTERNAL_SERVER_ERROR';
    exception?: {
        stacktrace: string[];
    };
    [key: string]: any;
};
export declare class CustomError extends Error {
    code: ErrorExtensions['code'];
    error: string;
    constructor(message: string, extensions: ErrorExtensions);
}
export declare function parseError(error: Error): CustomError;
export declare function debug(...data: any[]): void;
export declare function log(...data: any[]): void;
export {};
