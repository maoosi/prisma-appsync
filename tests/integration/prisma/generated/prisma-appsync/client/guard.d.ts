import { ShieldAuthorization, Shield } from './defs';
export declare function sanitize(data: object): object;
export declare function getAuthorization({ shield, paths }: {
    shield: Shield;
    paths: string[];
}): ShieldAuthorization;
export declare function getDepth({ paths }: {
    paths: string[];
}): number;
