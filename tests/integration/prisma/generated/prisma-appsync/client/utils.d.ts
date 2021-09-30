/**
 * Deep merge objects (without mutating the target object).
 * @param sources object[]
 * @returns object
 */
export declare function merge(...sources: object[]): any;
/**
 * Deep clone object.
 * @param source object
 * @returns object
 */
export declare function clone(source: object): any;
/**
 * Replace <, >, &, ', " and / with HTML entities.
 * @param str string
 * @returns string
 */
export declare function escapeHTML(str: string): string;
/**
 * Transform an object to a dotted-key/value pair
 * @param source object
 * @returns object
 */
export declare function dotate(source: object): any;
/**
 * Returns true if specified path matches any of the glob patterns.
 * @param path string
 * @param globPatterns string|string[]
 * @returns boolean
 */
export declare function isMatchingGlob(path: string, globPatterns: string | string[]): boolean;
/**
 * Sanitize untrusted HTML to prevent XSS.
 * @param str string
 * @returns string
 */
export declare function filterXSS(str: string): string;
/**
 * Return true if element is Empty
 * @param element any
 * @returns boolean
 */
export declare function isEmpty(element: any): boolean;
