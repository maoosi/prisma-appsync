export const argv: any

export function createServer({
    schema,
    lambdaHandler,
    port,
    defaultQuery,
    watchers
}: {
    schema: string
    lambdaHandler: any
    port: number
    defaultQuery?: string
    watchers?: { watch: string | string[]; exec: string }[]
}): void


