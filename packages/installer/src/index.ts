#!/usr/bin/env node
import { Installer } from './installer'

async function main(): Promise<any> {
    const installer = new Installer()
    return await installer.start()
}

main().catch((e) => {
    console.error(e)
    process.exit()
})
