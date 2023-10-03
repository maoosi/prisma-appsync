#!/usr/bin/env zx
/* eslint-disable no-console */
/* eslint-disable n/prefer-global/process */
import './env.mjs'

try {
    // cleanup previous generated files
    console.log(chalk.blue('Build :: Cleanup\n'))
    await $`rm -rf dist`

    if (!argv?.ignoreGenerator) {
        console.log(chalk.blue('\nBuild :: Generator\n'))

        // build Prisma-AppSync Generator
        await $`esbuild packages/generator/src/index.ts --bundle --format=cjs --keep-names --platform=node --target=node16 --external:fsevents --external:_http_common --define:import.meta.url='_importMetaUrl' --banner:js="const _importMetaUrl=require('url').pathToFileURL(__filename)" --outfile=dist/generator.js`
    }

    if (!argv?.ignoreClient) {
        console.log(chalk.blue('\nBuild :: Client\n'))

        // build Prisma-AppSync Client
        await $`esbuild packages/client/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' --format=cjs --minify --keep-names --platform=node --target=node16 --external:fsevents --external:@prisma/client --outfile=dist/client/index.js --legal-comments=inline`

        // build Prisma-AppSync Client TS Declarations
        await $`tsc packages/client/src/*.ts --outDir dist/client/ --declaration --emitDeclarationOnly --esModuleInterop --downlevelIteration`.nothrow()
    }

    if (!argv?.ignoreInstaller) {
        console.log(chalk.blue('\nBuild :: Installer\n'))

        if (process.env.COMPILE_MODE === 'preview') {
            // build installer (preview mode)
            await $`esbuild packages/installer/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' '--define:process.env.COMPILE_MODE="preview"' --format=cjs --minify --keep-names --platform=node --target=node16 --external:fsevents --external:_http_common --outfile=dist/installer/bin/index.js`
        }
        else {
            // build installer (default)
            await $`esbuild packages/installer/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' --format=cjs --minify --keep-names --platform=node --target=node16 --external:fsevents --external:_http_common --outfile=dist/installer/bin/index.js`
        }
    }

    if (!argv?.ignoreServer) {
        console.log(chalk.blue('\nBuild :: Local Server\n'))

        // build server
        await $`esbuild packages/server/src/index.ts --bundle --format=cjs --minify --keep-names --platform=node --target=node16 --external:fsevents --external:@prisma/client --external:amplify-appsync-simulator --external:_http_common --outfile=dist/server/index.js`

        // build server TS Declarations
        await $`cp packages/server/src/index.d.ts dist/server/index.d.ts && chmod -R 755 dist`

        // copy server .vtl files into build folder
        await $`cp -R packages/server/src/*.vtl dist/server && chmod -R 755 dist`
    }
}
catch (error) {
    console.log(chalk.red(`\nBuild :: Error\n\n${error}`))
}
