import { test } from 'vitest'

function format(str, ...args) {
    return str.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] != 'undefined' ? args[number] : match
    })
}

export function testEach(cases: any[][]): (name: string, fn: Function) => void {
    return (name, fn) => {
        cases.forEach((items) => {
            test(format(name, ...items), () => fn(...items))
        })
    }
}
