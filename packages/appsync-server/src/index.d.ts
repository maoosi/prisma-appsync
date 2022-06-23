export default function createServer({
    schema,
    lambdaHandler,
    headers,
    authorization,
    port,
}: {
    schema: string
    lambdaHandler: any
    headers?: any
    authorization?: Authorization
    port?: number
    watch?: {
        [fileOrDir: string]: ({
            evt,
            name,
            exec,
        }: {
            evt: any
            name: string
            exec: (command: string, options?: { cwd?: string }) => Promise<{ err: any; strdout: any; stderr: any }>
        }) => Promise<void>
    }
}): void

export declare enum Authorizations {
    API_KEY = 'API_KEY',
    AWS_IAM = 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
    AWS_LAMBDA = 'AWS_LAMBDA',
    OPENID_CONNECT = 'OPENID_CONNECT',
}

export declare type Authorization = typeof Authorizations[keyof typeof Authorizations] | null
