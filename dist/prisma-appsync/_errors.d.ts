import { CustomError } from 'ts-custom-error';
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
