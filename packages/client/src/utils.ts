import { set } from 'wild-wild-path'
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
 * #### Traverse any element and execute middleware
 *
 * @example const element = traverse(element, value => doSomething(value))
 *
 * @param {any} element
 * @param {Function} iteratee
 * @returns any
 */
export function traverse(
    element: any,
    iteratee: (
        { value, key, path }: { value: any; key?: string; path: any[] }
    ) => { value: any; excludeChilds?: boolean },
    parentPath?: any[],
): any {
    const path: any = parentPath || []

    let outputData

    // object
    if (isObject(element)) {
        outputData = clone(element)

        for (const key in outputData) {
            if (Object.prototype.hasOwnProperty.call(outputData, key)) {
                path.push(key)
                const { excludeChilds, value } = iteratee({ value: outputData[key], key, path })

                // object
                if (isObject(value)) {
                    if (excludeChilds)
                        outputData[key] = clone(value)
                    else
                        outputData[key] = traverse(value, iteratee, path)
                }
                // array
                else if (Array.isArray(value)) {
                    if (excludeChilds)
                        outputData[key] = [...value]
                    else
                        outputData[key] = traverse(value, iteratee, path)
                }
                // anything else
                else {
                    outputData[key] = value
                }
            }
        }
    }
    // array
    else if (Array.isArray(element)) {
        const { value } = iteratee({ value: element, path })
        outputData = [...value]
        outputData = [...outputData.map((e: any, i: number) => traverse(e, iteratee, [...path, i]))]
    }
    // anything else
    else {
        path.push(element)
        const { value } = iteratee({ value: element, path })
        outputData = value
    }

    return outputData
}

/**
 * #### Traverse any element and execute middleware (Async)
 *
 * @example const element = await traverse(element, value => doSomething(value))
 *
 * @param {any} element
 * @param {Function} iteratee
 * @returns Promise<any>
 */
export async function traverseAsync(
    element: any,
    iteratee: ({ value, key, path }: { value: any; key?: string; path: any[] }) => Promise<{ value: any; excludeChilds?: boolean }>,
    parentPath?: any[],
): Promise<any> {
    const path: any = parentPath || []

    let outputData

    // object
    if (isObject(element)) {
        outputData = clone(element)

        for (const key in outputData) {
            if (Object.prototype.hasOwnProperty.call(outputData, key)) {
                path.push(key)
                const { excludeChilds, value } = await iteratee({ value: outputData[key], key, path })

                // object
                if (isObject(value)) {
                    if (excludeChilds)
                        outputData[key] = clone(value)
                    else
                        outputData[key] = await traverseAsync(value, iteratee, path)
                }
                // array
                else if (Array.isArray(value)) {
                    if (excludeChilds)
                        outputData[key] = [...value]
                    else
                        outputData[key] = await traverseAsync(value, iteratee, path)
                }
                // anything else
                else {
                    outputData[key] = value
                }
            }
        }
    }
    // array
    else if (Array.isArray(element)) {
        const { value } = await iteratee({ value: element, path })
        outputData = [...value]
        for (let index = 0; index < outputData.length; index++)
            outputData[index] = await traverseAsync(outputData[index], iteratee, [...path, index])
    }
    // anything else
    else {
        path.push(element)
        const { value } = await iteratee({ value: element, path })
        outputData = value
    }

    return outputData
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
 * #### Replace object path content (mutate original object)
 *
 * @example replaceObjectPath({ where: { author: { is: 'NULL' } } }, ['where', 'author', 'is'], null)
 *
 * @param {any} obj
 * @param {string[]} path
 * @param {any} replacer
 * @returns any
 */
export function replaceObjectPath(obj, path: string[], replacer: any): any {
    return set(obj, path, replacer, { mutate: true })
}

/**
 * #### Return unique array
 *
 * @example unique(['a', 'b', 'a'])
 *
 * @param {any[]} array
 * @returns any[]
 */
export function unique(array): any {
    return [...new Set(array)]
}
