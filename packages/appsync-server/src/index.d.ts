export default function createServer({ schema, lambdaHandler, headers, authorization, port }: {
    schema: string;
    lambdaHandler: (...args: any) => Promise<any>;
    headers?: any;
    authorization?: Authorization;
    port?: number;
}): void;

export declare enum Authorizations {
    API_KEY = "API_KEY",
    AWS_IAM = "AWS_IAM",
    AMAZON_COGNITO_USER_POOLS = "AMAZON_COGNITO_USER_POOLS",
    AWS_LAMBDA = "AWS_LAMBDA",
    OPENID_CONNECT = "OPENID_CONNECT"
}

export declare type Authorization = typeof Authorizations[keyof typeof Authorizations] | null;