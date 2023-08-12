import { flatten } from 'wild-wild-utils'
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
    return flatten(source, { shallowArrays: true })
}

/**
 * #### Transform an object to an array of paths.
 *
 * @example objectToPaths({ data: { title: "glut" } })
 * // returns [ 'data', 'data/title']
 *
 * @param {any} source
 * @returns any
 */
export function objectToPaths(source: any): string[] {
    const dotObject = flatten(source)
    const dotPaths = Object.keys(dotObject).map((k: string) => {
        return k
            .split('.')
            .filter((part) => {
                const isDigit = Boolean(/\b(\d+)\b/gi.exec(part))
                return !isDigit
            })
            .join('/')
    })
    const paths: string[] = []
    const seen: Set<string> = new Set()

    for (const dotPath of dotPaths) {
        const parts = dotPath.split('/')
        let current = ''

        for (const part of parts) {
            current += current === '' ? part : `/${part}`
            if (!seen.has(current)) {
                paths.push(current)
                seen.add(current)
            }
        }
    }

    return paths
}

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
export function omit(obj: any, omitKey: string | string[]): any {
    const newObj = clone(obj)
    const omitKeys = !Array.isArray(omitKey) ? [omitKey] : omitKey
    omitKeys.forEach(k => delete newObj?.[k])
    return newObj
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
        element === null
        || element === undefined
        || typeof element === 'undefined'
        || (typeof element === 'string' && element.trim() === '')
        || (Array.isArray(element) && element.length === 0)
        || (Object.getPrototypeOf(element) === Object.prototype && Object.keys(element).length === 0)
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

/**
 * #### Return string with first letter lowercase.
 *
 * @example lowerFirst("PostOffice")
 * // returns 'postOffice'
 *
 * @param {string} str
 * @returns string
 */
export function lowerFirst(str: string): string {
    if (str)
        return str.charAt(0).toLowerCase() + str.slice(1)
    else
        return String()
}

/**
 * #### Return string with first letter uppercase.
 *
 * @example upperFirst("postOffice")
 * // returns 'PostOffice'
 *
 * @param {string} str
 * @returns string
 */
export function upperFirst(str: string): string {
    if (str)
        return str.charAt(0).toUpperCase() + str.slice(1)
    else return String()
}

/**
 * #### Return true if element is an object
 *
 * @example const isObj = isObject(element)
 *
 * @param {any} element
 * @returns boolean
 */
export function isObject(element): boolean {
    return (
        typeof element === 'object'
        && !Array.isArray(element)
        && typeof element !== 'function'
        && element !== null
        && !(element instanceof Date)
    )
}

/**
 * Applies a mutation function to each key and value of an object recursively.
 * Ensures immutability of the original object by returning a new, deeply-copied and mutated object.
 *
 * @param {Object} obj - Original object.
 * @param {Function} fn - Async mutator function, should return an object with potentially new key-value pair.
 * @return {Object} - A new mutated object.
 */
async function walkObj(
    obj: any,
    fn: (arg: { key: string; value: any }, node: WalkNode) => Promise<{ key: string; value: any }>,
    node: WalkNode = new WalkNode(),
): Promise<any> {
    const clonedObj = clone(obj)
    const out: any = {}
    const keys = Object.keys(clonedObj)

    for (const key of keys) {
        const newNode = new WalkNode([...node.path, key])
        let { key: newKey, value: newValue } = await fn({ key, value: clonedObj[key] }, newNode)

        if (newValue && isObject(newValue) && !newNode.ignoreChildren) {
            newValue = await walkObj(newValue, fn, newNode)
        }

        else if (newValue && Array.isArray(newValue) && !newNode.ignoreChildren) {
            for (let idx = 0; idx < newValue.length; idx++) {
                if (newValue[idx] && isObject(newValue[idx]))
                    newValue[idx] = await walkObj(newValue[idx], fn, new WalkNode([...newNode.path, idx]))
            }
        }

        out[newKey] = newValue
    }

    return out
}
export async function walk(
    obj: any,
    fn: (arg: { key: string; value: any }, node: WalkNode) => Promise<{ key: string; value: any }>,
): Promise<any> {
    return Array.isArray(obj)
        ? await Promise.all(obj.map(async value => await walkObj(value, fn)))
        : await walkObj(obj, fn)
}
class WalkNode {
    constructor(public path: (string | number)[] = [], public ignoreChildren: boolean = false) {
        this.path = path
        this.ignoreChildren = ignoreChildren
    }

    ignoreChilds() { this.ignoreChildren = true }
    getPath() { return this.path }
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
export function replaceAll(str: string, findArray: string[], replaceArray: string[]): string {
    let regex: string[] | string = []
    const map = {}

    for (let i = 0; i < findArray.length; i++) {
        regex.push(findArray[i].replace(/([-[\]{}()*+?.\\^$|#,])/g, '\\$1'))
        map[findArray[i]] = replaceArray[i]
    }

    regex = regex.join('|')

    str = str.replace(new RegExp(regex, 'g'), (matched) => {
        return map[matched]
    })

    return str
}

/**
 * #### Return unique array
 *
 * @example unique(['a', 'b', 'a'])
 *
 * @param {any[]} array
 * @returns any[]
 */
export function unique(array: Iterable<any> | null | undefined): any[] {
    return [...new Set(array)]
}
