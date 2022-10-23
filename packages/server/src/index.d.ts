export const argv: any

export function createServer({
    schema,
    lambdaHandler,
    port,
    defaultQuery,
    watch,
    exec
}: {
    schema: string
    lambdaHandler: any
    port: number
    defaultQuery?: string
    watch?: string[]
    exec?: string
}): void


