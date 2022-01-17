import {
    merge,
    clone,
    decode,
    encode,
    dotate,
    isMatchingGlob,
    isEmpty,
    filterXSS,
    isUndefined,
    lowerFirst,
    isObject,
    traverse,
} from '../../packages/client/utils'

process.env.PRISMA_APPSYNC_TESTING = 'true'

describe('CLIENT #utils', () => {
    describe('.merge?', () => {
        test('expect merge to deep merge objects', () => {
            const obj1 = {
                select: {
                    title: true,
                    author: {
                        select: { username: true },
                    },
                },
            }
            const obj2 = {
                select: {
                    description: true,
                    author: {
                        select: { email: true },
                    },
                },
            }
            const obj3 = {
                data: { where: { id: 1 } },
            }
            expect(merge(obj1, obj2, obj3)).toEqual({
                data: { where: { id: 1 } },
                select: {
                    title: true,
                    description: true,
                    author: {
                        select: { username: true, email: true },
                    },
                },
            })
        })
    })
    describe('.clone?', () => {
        test('expect clone to deep clone object', () => {
            const obj1 = {
                select: {
                    title: true,
                    author: {
                        select: { username: true },
                    },
                },
            }
            expect(clone(obj1)).toEqual(obj1)
        })
    })
    describe('.decode?', () => {
        test('expect decode to decode HTML characters', () => {
            const result = decode('&lt; &gt; &quot; &apos; &amp;')
            expect(result).toEqual('< > " \' &')
        })
    })
    describe('.encode?', () => {
        test('expect encode to encode HTML characters', () => {
            const result = encode('< > " \' &')
            expect(result).toEqual('&lt; &gt; &quot; &apos; &amp;')
        })
    })
    describe('.dotate?', () => {
        test('expect dotate to transform an object to a dotted-key/value pair', () => {
            const result = dotate({ data: { title: 'glut' } })
            expect(result).toEqual({ 'data.title': 'glut' })
        })
    })
    describe('.isMatchingGlob?', () => {
        test('expect isMatchingGlob to return true if specified path matches any of the glob patterns', () => {
            const result = isMatchingGlob('get/post/title', ['get/post{,/**}'])
            expect(result).toEqual(true)
        })
        test('expect isMatchingGlob to return false if specified path does not match any of the glob patterns', () => {
            const result = isMatchingGlob('get/comment/title', ['get/post{,/**}'])
            expect(result).toEqual(false)
        })
    })
    describe('.filterXSS?', () => {
        test('expect filterXSS to sanitize untrusted HTML to prevent XSS', () => {
            const result = filterXSS('<script>alert("xss");</scr' + 'ipt>')
            expect(result).toEqual('&lt;script&gt;alert("xss");&lt;/script&gt;')
        })
    })
    describe('.isEmpty?', () => {
        test('expect isEmpty to return true if element is Undefined', () => {
            const test: any = {}
            expect(isEmpty(test?.data?.title)).toEqual(true)
        })
        test('expect isEmpty to return true if element is an Empty object', () => {
            const test: any = {}
            expect(isEmpty(test)).toEqual(true)
        })
        test('expect isEmpty to return true if element is an Empty String', () => {
            const test = ' '
            expect(isEmpty(test)).toEqual(true)
        })
        test('expect isEmpty to return true if element is Null', () => {
            const test = null
            expect(isEmpty(test)).toEqual(true)
        })
        test('expect isEmpty to return true if element is an Empty Array', () => {
            const test = []
            expect(isEmpty(test)).toEqual(true)
        })
    })
    describe('.isUndefined?', () => {
        test('expect isUndefined to return true if element is Undefined', () => {
            const test: any = {}
            expect(isUndefined(test?.data)).toEqual(true)
        })
        test('expect isUndefined to return false if element is Defined', () => {
            const test: any = { data: null }
            expect(isUndefined(test?.data)).toEqual(false)
        })
    })
    describe('.lowerFirst?', () => {
        test('expect lowerFirst to return a string with first letter lowercase', () => {
            expect(lowerFirst('HELLO')).toEqual('hELLO')
        })
    })
    describe('.isObject?', () => {
        test('expect isObject to return true if element is an Object', () => {
            expect(isObject({})).toEqual(true)
        })
        test('expect isObject to return false if element is Null', () => {
            expect(isObject(null)).toEqual(false)
        })
        test('expect isObject to return false if element is a Function', () => {
            expect(isObject(() => 'xxx')).toEqual(false)
        })
        test('expect isObject to return false if element is an Array', () => {
            expect(isObject([])).toEqual(false)
        })
    })
    describe('.traverse?', () => {
        test('expect traverse to allow traverse an modify an Object', () => {
            const result = traverse(
                {
                    select: {
                        title: true,
                        authors: [
                            {
                                select: { username: true },
                            },
                        ],
                    },
                },
                (value) => {
                    if (typeof value === 'boolean') value = !value
                    return { value }
                },
            )
            expect(result).toEqual({
                select: {
                    title: false,
                    authors: [
                        {
                            select: { username: false },
                        },
                    ],
                },
            })
        })
        test('expect traverse to allow exclude keys in Object', () => {
            const result = traverse(
                {
                    select: {
                        title: true,
                        authors: [
                            {
                                select: { username: true },
                            },
                        ],
                    },
                },
                (value, key) => {
                    let excludeChilds = false
                    if (typeof key === 'string' && key === 'authors') excludeChilds = true
                    if (typeof value === 'boolean') value = !value
                    return { value, excludeChilds }
                },
            )
            expect(result).toEqual({
                select: {
                    title: false,
                    authors: [
                        {
                            select: { username: true },
                        },
                    ],
                },
            })
        })
        test('expect traverse to allow traverse an modify an Array', () => {
            const result = traverse([{ authors: { username: true } }, { comments: { username: true } }], (value) => {
                if (typeof value === 'boolean') value = !value
                return { value }
            })
            expect(result).toEqual([{ authors: { username: false } }, { comments: { username: false } }])
        })
        test('expect traverse to allow excluding elements in Array', () => {
            const result = traverse(
                [{ authors: { username: true } }, { comments: { username: true } }],
                (value, key) => {
                    const excludeChilds = !!(typeof key === 'string' && key === 'comments')
                    if (typeof value === 'boolean') value = !value
                    return { value, excludeChilds }
                },
            )
            expect(result).toEqual([{ authors: { username: false } }, { comments: { username: true } }])
        })
    })
})
