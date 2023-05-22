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
 * #### Walk object tree nodes and return a mutated copy.
 *
 * @example const newObj = await traverseNodes(oldObj, async(node) => {})
 *
 * @param {any} node
 * @param {Function} callback
 * @returns Promise<any>
 */

export async function traverseNodes(
    node: any,
    callback: (node: TraverseNode) => Promise<void>,
    parentKey?: string | number,
    key?: string | number,
    path: (string | number)[] = [],
): Promise<any> {
    if (
        node && Array.isArray(node)
    ) {
        let newArray: any[] = [...node]
        let shouldContinue = true

        const setFn = (newVal: any) => {
            newArray = newVal
        }

        const breakFn = () => {
            shouldContinue = false
        }

        const traverseNode: TraverseNode = {
            parentKey,
            childKeys: Array.from(Array(newArray.length).keys()),
            key,
            value: newArray,
            type: 'array',
            path: typeof key !== 'undefined' ? [...path, key] : [...path],
            set: setFn,
            break: breakFn,
        }

        await callback(traverseNode)

        if (shouldContinue) {
            for (let childKey = 0; childKey < node.length; childKey++) {
                const childValue = node[childKey]
                newArray[childKey] = await traverseNodes(
                    childValue,
                    callback,
                    key,
                    childKey,
                    typeof key !== 'undefined' ? [...path, key] : [...path],
                )
            }
        }

        return newArray
    }
    else if (
        node
        && typeof node === 'object'
        && !Array.isArray(node)
        && typeof node !== 'function'
        && node !== null
        && !(node instanceof Date)
    ) {
        let newObject: any = { ...node }
        let shouldContinue = true

        const setFn = (newVal: any) => {
            newObject = newVal
        }

        const breakFn = () => {
            shouldContinue = false
        }

        const traverseNode: TraverseNode = {
            parentKey,
            childKeys: Object.keys(newObject),
            key,
            value: newObject,
            type: 'object',
            path: typeof key !== 'undefined' ? [...path, key] : [...path],
            set: setFn,
            break: breakFn,
        }

        await callback(traverseNode)

        if (shouldContinue) {
            for (const [childKey, childValue] of Object.entries(newObject)) {
                newObject[childKey] = await traverseNodes(
                    childValue,
                    callback,
                    key,
                    childKey,
                    typeof key !== 'undefined' ? [...path, key] : [...path],
                )
            }
        }

        return newObject
    }
    else {
        let newValue = node

        const setFn = (newVal: any) => {
            newValue = newVal
        }

        const breakFn = () => { }

        const traverseNode: TraverseNode = {
            parentKey,
            childKeys: [],
            key,
            value: newValue,
            type: 'value',
            path: typeof key !== 'undefined' ? [...path, key] : [...path],
            set: setFn,
            break: breakFn,
        }

        await callback(traverseNode)

        return newValue
    }
}

interface TraverseNode {
    parentKey?: string | number
    childKeys?: (string | number)[]
    key?: string | number
    value: any
    type: 'array' | 'object' | 'value'
    path: (string | number)[]
    set: (newValue: any) => void
    break: () => void
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
