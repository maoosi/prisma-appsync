import type { logLevel } from './types';
declare const errorCodes: {
    FORBIDDEN: number;
    BAD_USER_INPUT: number;
    INTERNAL_SERVER_ERROR: number;
    TOO_MANY_REQUESTS: number;
};
export type ErrorExtensions = {
    type: keyof typeof errorCodes;
    cause?: any;
};
export type ErrorDetails = {
    error: string;
    type: ErrorExtensions['type'];
    code: number;
    cause?: ErrorExtensions['cause'];
};
export declare class CustomError extends Error {
    error: ErrorDetails['error'];
    type: ErrorDetails['type'];
    code: ErrorDetails['code'];
    cause: ErrorDetails['cause'];
    details: ErrorDetails;
    constructor(message: string, extensions: ErrorExtensions);
}
export declare function parseError(error: Error): CustomError;
export declare function log(message: string, obj?: any, level?: logLevel): void;
export declare function printLog(message: any, level: logLevel): void;
export {};
