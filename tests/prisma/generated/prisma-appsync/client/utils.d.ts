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
 * @example const isObj = isObject(element)
 *
 * @param {any} element
 * @returns boolean
 */
export declare function isObject(element: any): boolean;
/**
 * #### Traverse any element and execute middleware
 *
 * @example const element = traverse(element, value => doSomething(value))
 *
 * @param {any} element
 * @param {Function} iteratee
 * @returns any
 */
export declare function traverse(element: any, iteratee: (value: any, key?: string) => {
    value: any;
    excludeChilds?: boolean;
}): any;
/**
 * #### Traverse any element and execute middleware (Async)
 *
 * @example const element = await traverse(element, value => doSomething(value))
 *
 * @param {any} element
 * @param {Function} iteratee
 * @returns Promise<any>
 */
export declare function traverseAsync(element: any, iteratee: (value: any, key?: string) => Promise<{
    value: any;
    excludeChilds?: boolean;
}>): Promise<any>;
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
