import { dot } from 'dot-object'
import { isMatch } from 'micromatch'
import deepmerge from 'deepmerge'
import escape from 'validator/lib/escape'
import xss from 'xss'

/**
 * Deep merge objects (without mutating the target object).
 * @param sources object[]
 * @returns object
 */
export function merge(...sources: object[]):any {
    return deepmerge.all(sources)
}

/**
 * Deep clone object.
 * @param source object
 * @returns object
 */
export function clone(source: object):any {
    return deepmerge({}, source)
}

/**
 * Replace <, >, &, ', " and / with HTML entities.
 * @param str string
 * @returns string
 */
export function escapeHTML(str: string):string {
    return escape(str)
}

/**
 * Transform an object to a dotted-key/value pair
 * @param source object
 * @returns object
 */
export function dotate(source: object):any {
    return dot(source)
}

/**
 * Returns true if specified path matches any of the glob patterns.
 * @param path string
 * @param globPatterns string|string[]
 * @returns boolean
 */
export function isMatchingGlob(path: string, globPatterns: string|string[]): boolean {
    return isMatch(path, globPatterns)
}

/**
 * Sanitize untrusted HTML to prevent XSS.
 * @param str string
 * @returns string
 */
export function filterXSS(str: string):string {
    return xss(str)
}