import type { logLevel } from './defs';
declare const errorCodes: {
    FORBIDDEN: number;
    BAD_USER_INPUT: number;
    INTERNAL_SERVER_ERROR: number;
    TOO_MANY_REQUESTS: number;
};
export interface ErrorExtensions {
    type: keyof typeof errorCodes;
    trace?: string[];
    [key: string]: any;
}
export interface ErrorDetails {
    error: string;
    type: ErrorExtensions['type'];
    code: number;
    trace: ErrorExtensions['trace'];
}
export declare class CustomError extends Error {
    error: ErrorDetails['error'];
    type: ErrorDetails['type'];
    code: ErrorDetails['code'];
    trace: ErrorDetails['trace'];
    details: ErrorDetails;
    constructor(message: string, extensions: ErrorExtensions);
}
export declare function parseError(error: Error): CustomError;
export declare function log(message: string, obj?: any, level?: logLevel): void;
export declare function printLog(message: any, level: logLevel): void;
export {};
