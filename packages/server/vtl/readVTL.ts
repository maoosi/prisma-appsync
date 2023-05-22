import { readFileSync } from 'fs'
import { resolve } from 'path'

export const readVTL = (filename: string) => {
    return readFileSync(resolve(__dirname, filename), 'utf8')
}
