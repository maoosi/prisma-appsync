---
sidebarDepth: 2
---

# Client Types

The Prisma-AppSync Client Types reference:

## Constructor

### Options

```typescript
export type Options = {
    customResolvers?: any
    connectionUrl: string
    debug?: boolean
    sanitize?: boolean
}
```

## Hooks

### BeforeResolveProps

```typescript
export type BeforeResolveProps = {
    operation: Operation
    args: RequestProps
    authIdentity: AuthIdentityProps
    fields: string[]
    requestSetPaths: any
    subject: string
}
```

### AfterResolveProps

```typescript
export type AfterResolveProps = {
    operation: Operation
    args: RequestProps
    authIdentity: AuthIdentityProps
    fields: string[]
    requestSetPaths: any
    result: any
    subject: string
}
```

### RequestProps

```typescript
export type RequestProps = {
    data?: any
    select?: any
    include?: any
    where?: any
    orderBy?: any
    [key:string]: any
}
```

## Custom resolvers

### CustomResolverProps

```typescript
export type CustomResolverProps = {
    args?: RequestProps
    authIdentity?: AuthIdentityProps
}
```

## Access-control

### AuthRule

```typescript
export type AuthRule = {
    action: AuthAction|AuthAction[]
    subject: string|string[]
    fields?: string[]
    condition?: any|any[]
    reason?:string
}
```

## Authorization

### AuthIdentityProps

```typescript
export type AuthIdentityProps = {
    authorization: AuthType
    [key:string]: any
}
```

### AuthType

```typescript
export type AuthType = typeof AuthModes[keyof typeof AuthModes]
```

### AuthModes

```typescript
export const AuthModes = {
    API_KEY: 'API_KEY',
    AWS_IAM: 'AWS_IAM',
    AMAZON_COGNITO_USER_POOLS: 'AMAZON_COGNITO_USER_POOLS'
} as const
```

### AuthRule

```typescript
export type AuthRule = {
    action: AuthAction|AuthAction[]
    subject: string|string[]
    fields?: string[]
    condition?: any|any[] // see: https://casl.js.org/v4/en/guide/conditions-in-depth
    reason?:string
}
```

### AuthActions

```typescript
export const AuthActions = {
    all: 'all', // alias to: everything
    manage: 'manage', // alias to: everything
    access: 'access', // alias to: get + list
    modify: 'modify', // alias to: upsert + update + delete
    custom: 'custom',
    get: 'get',
    list: 'list',
    create: 'create',
    upsert: 'upsert',
    update: 'update',
    delete: 'delete',
    deleteMany: 'deleteMany',
} as const
```

### AuthAction

```typescript
export type AuthAction = typeof AuthActions[keyof typeof AuthActions]
```
