import { dot } from 'dot-object'
import { isMatch } from 'micromatch'
import deepmerge from 'deepmerge'
import { decode as decodeHtml, encode as encodeHtml } from 'html-entities'
import xss from 'xss'

/**
 * #### Deep merge objects (without mutating the target object).
 *
 * @example const newObj = merge(obj1, obj2, obj3)
 *
 * @param {any[]} sources
 * @returns any
 */
export function merge(...sources: any[]): any {
    return deepmerge.all(sources)
}

/**
 * #### Deep clone object.
 *
 * @example const newObj = clone(sourceObj)
 *
 * @param {any} source
 * @returns any
 */
export function clone(source: any): any {
    return deepmerge({}, source)
}

/**
 * #### Returns decoded text, replacing HTML special characters.
 *
 * @example decode('&lt; &gt; &quot; &apos; &amp; &#169; &#8710;')
 * // returns '< > " \' & © ∆'
 *
 * @param {string} str
 * @returns string
 */
export function decode(str: string): string {
    return decodeHtml(str)
}

/**
 * #### Returns encoded text, version of string.
 *
 * @example encode('<script>alert("xss");</scr' + "ipt>")
 *
 * @param {string} str
 * @returns string
 */
export function encode(str: string): string {
    return encodeHtml(str)
}

/**
 * #### Transform an object to a dotted-key/value pair.
 *
 * @example dotate({ data: { title: "glut" } })
 * // returns { 'data.title': 'glut' }
 *
 * @param {any} source
 * @returns any
 */
export function dotate(source: any): any {
    return dot(source)
}

/**
 * #### Returns true if specified path matches any of the glob patterns.
 *
 * @example isMatchingGlob('get/post/title', ['get/post{,/**}'])
 *
 * @param {string} path
 * @param {string|string[]} globPatterns
 * @returns boolean
 */
export function isMatchingGlob(path: string, globPatterns: string | string[]): boolean {
    return isMatch(path, globPatterns)
}

/**
 * #### Sanitize untrusted HTML to prevent XSS.
 *
 * @example filterXSS('<script>alert("xss");</scr' + "ipt>")
 *
 * @param {string} str
 * @returns string
 */
export function filterXSS(str: string): string {
    return xss(str)
}

/**
 * #### Return true if element is Empty.
 *
 * @example isEmpty(prismaArgs?.data?.title)
 *
 * @param {any} element
 * @returns boolean
 */
export function isEmpty(element: any): boolean {
    return (
        element === null ||
        element === undefined ||
        typeof element === 'undefined' ||
        (typeof element === 'string' && element.trim() === '') ||
        (Array.isArray(element) && element.length === 0) ||
        (Object.getPrototypeOf(element) === Object.prototype && Object.keys(element).length === 0)
    )
}

/**
 * #### Return true if element is Undefined.
 *
 * @example isUndefined(prismaArgs?.data?.title)
 *
 * @param {any} element
 * @returns boolean
 */
export function isUndefined(element: any): boolean {
    return element === undefined || typeof element === 'undefined'
}