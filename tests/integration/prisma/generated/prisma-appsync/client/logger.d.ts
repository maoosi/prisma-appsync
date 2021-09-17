import { CustomError } from 'ts-custom-error';
import { inspect } from 'util';
export { inspect };
export declare function log(log: any): void;
export declare class InternalError extends CustomError {
    private privateMessage;
    errorType: string;
    errorInfo: string;
    data: any;
    constructor(message?: string);
    getLogs(): string;
}
export declare class UnauthorizedError extends CustomError {
    private privateMessage;
    errorType: string;
    errorInfo: string;
    data: any;
    constructor(message?: string);
    getLogs(): string;
}
export declare class BadRequestError extends CustomError {
    private privateMessage;
    errorType: string;
    errorInfo: string;
    data: any;
    constructor(message?: string);
    getLogs(): string;
}
