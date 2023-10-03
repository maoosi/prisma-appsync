/**
 * #### Deep merge objects (without mutating the target object).
 *
 * @example const newObj = merge(obj1, obj2, obj3)
 *
 * @param {any[]} sources
 * @returns any
 */
export declare function merge(...sources: any[]): any;
/**
 * #### Deep clone object.
 *
 * @example const newObj = clone(sourceObj)
 *
 * @param {any} source
 * @returns any
 */
export declare function clone(source: any): any;
/**
 * #### Returns decoded text, replacing HTML special characters.
 *
 * @example decode('&lt; &gt; &quot; &apos; &amp; &#169; &#8710;')
 * // returns '< > " \' & © ∆'
 *
 * @param {string} str
 * @returns string
 */
export declare function decode(str: string): string;
/**
 * #### Returns encoded text, version of string.
 *
 * @example encode('<script>alert("xss");</scr' + "ipt>")
 *
 * @param {string} str
 * @returns string
 */
export declare function encode(str: string): string;
/**
 * #### Transform an object to a dotted-key/value pair.
 *
 * @example dotate({ data: { title: "glut" } })
 * // returns { 'data.title': 'glut' }
 *
 * @param {any} source
 * @returns any
 */
export declare function dotate(source: any): any;
/**
 * #### Transform an object to an array of paths.
 *
 * @example objectToPaths({ data: { title: "glut" } })
 * // returns [ 'data', 'data/title']
 *
 * @param {any} source
 * @returns any
 */
export declare function objectToPaths(source: any): string[];
/**
 * #### Return an object ommitting one to multiple keys.
 *
 * @example omit({ foo: 'foo', bar: 'bar' }, 'foo')
 * // returns { foo: 'foo' }
 *
 * @param {any} obj
 * @param {string | string[]} omitKey
 * @returns any
 */
export declare function omit(obj: any, omitKey: string | string[]): any;
/**
 * #### Returns true if specified path matches any of the glob patterns.
 *
 * @example isMatchingGlob('get/post/title', ['get/post{,/**}'])
 *
 * @param {string} path
 * @param {string|string[]} globPatterns
 * @returns boolean
 */
export declare function isMatchingGlob(path: string, globPatterns: string | string[]): boolean;
/**
 * #### Sanitize untrusted HTML to prevent XSS.
 *
 * @example filterXSS('<script>alert("xss");</scr' + "ipt>")
 *
 * @param {string} str
 * @returns string
 */
export declare function filterXSS(str: string): string;
/**
 * #### Return true if element is Empty.
 *
 * @example isEmpty(prismaArgs?.data?.title)
 *
 * @param {any} element
 * @returns boolean
 */
export declare function isEmpty(element: any): boolean;
/**
 * #### Return true if element is Undefined.
 *
 * @example isUndefined(prismaArgs?.data?.title)
 *
 * @param {any} element
 * @returns boolean
 */
export declare function isUndefined(element: any): boolean;
/**
 * #### Return true if element is an Array
 *
 * @example isArray(element)
 *
 * @param {any} element
 * @returns boolean
 */
export declare const isArray: (val: any) => val is any[];
/**
 * #### Return string with first letter lowercase.
 *
 * @example lowerFirst("PostOffice")
 * // returns 'postOffice'
 *
 * @param {string} str
 * @returns string
 */
export declare function lowerFirst(str: string): string;
/**
 * #### Return string with first letter uppercase.
 *
 * @example upperFirst("postOffice")
 * // returns 'PostOffice'
 *
 * @param {string} str
 * @returns string
 */
export declare function upperFirst(str: string): string;
/**
 * #### Return true if element is an object
 *
 * @example isObject(element)
 *
 * @param {any} element
 * @returns boolean
 */
export declare const isObject: (val: any) => val is object;
/**
 * #### Return true if element is a function
 *
 * @example isFunction(element)
 *
 * @param {any} element
 * @returns boolean
 */
export declare const isFunction: <T extends Function>(val: any) => val is T;
/**
 * Applies a mutation function to each key and value of an object recursively.
 * Ensures immutability of the original object by returning a new, deeply-copied and mutated object.
 *
 * @param {Object} obj - Original object.
 * @param {Function} fn - Async mutator function, should return an object with potentially new key-value pair.
 * @return {Object} - A new mutated object.
 */
export declare function walk(jsonObj: any, fn: (arg: {
    key: string;
    value: any;
}, node: WalkNode) => Promise<{
    key: string;
    value: any;
}>): Promise<any>;
declare class WalkNode {
    _path: (string | number)[];
    _ignoreChildren: boolean;
    constructor(_path?: (string | number)[], _ignoreChildren?: boolean);
    ignoreChilds(): void;
    getPath(): (string | number)[];
}
/**
 * #### Replace all from findArray with replaceArray
 *
 * @example replaceAll('you & me', ['you','me'], ['me','you'])
 *
 * @param {string} str
 * @param {string[]} findArray
 * @param {string[]} replaceArray
 * @returns string
 */
export declare function replaceAll(str: string, findArray: string[], replaceArray: string[]): string;
/**
 * #### Creates a duplicate-free version of an array
 *
 * @example uniq(['a', 'b', 'a'])
 *
 * @param {any[]} array
 * @returns any[]
 */
export declare function uniq<T>(array: readonly T[]): T[];
/**
 * #### Creates a duplicate-free version of an array using iteratee
 *
 * @category Array
 */
export declare function uniqBy<T>(array: readonly T[], iteratee: keyof T | ((a: any) => any)): T[];
export {};
