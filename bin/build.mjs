#!/usr/bin/env zx
/* eslint-disable no-console */
/* eslint-disable n/prefer-global/process */
import './env.mjs'

try {
    // cleanup previous generated files
    console.log(chalk.blue('\n🧹 [chore] cleanup\n'))
    await $`rm -rf dist`.quiet()

    if (!argv?.ignoreGenerator) {
        console.log(chalk.blue('🛠️  [build] packages/generator'))

        // build Prisma-AppSync Generator
        await $`esbuild packages/generator/src/index.ts --bundle --format=cjs --keep-names --platform=node --target=node18 --external:fsevents --external:_http_common --outfile=dist/generator.js --define:import.meta.url='_importMetaUrl' --banner:js="const _importMetaUrl=require('url').pathToFileURL(__filename)"`.quiet()
    }

    if (!argv?.ignoreClient) {
        console.log(chalk.blue('🛠️  [build] packages/client'))

        // build Prisma-AppSync Client
        await $`esbuild packages/client/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' --format=cjs --minify --keep-names --platform=node --target=node18 --external:fsevents --external:@prisma/client --outfile=dist/client/index.js --legal-comments=inline`.quiet()

        console.log(chalk.blue('🛠️  [build] packages/client types'))

        // build Prisma-AppSync Client TS Declarations
        await $`tsc packages/client/src/*.ts --outDir dist/client/ --declaration --emitDeclarationOnly --esModuleInterop --downlevelIteration`.nothrow().quiet()
    }

    if (!argv?.ignoreInstaller) {

        if (process.env.COMPILE_MODE === 'preview') {
            console.log(chalk.blue('🛠️  [build] packages/installer (preview mode)'))

            // build installer (preview mode)
            await $`esbuild packages/installer/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' '--define:process.env.COMPILE_MODE="preview"' --format=cjs --minify --keep-names --platform=node --target=node18 --external:fsevents --external:_http_common --outfile=dist/installer/bin/index.js`.quiet()
        }
        else {
            console.log(chalk.blue('🛠️  [build] packages/installer'))

            // build installer (default)
            await $`esbuild packages/installer/src/index.ts --bundle '--define:process.env.NODE_ENV="production"' --format=cjs --minify --keep-names --platform=node --target=node18 --external:fsevents --external:_http_common --outfile=dist/installer/bin/index.js`.quiet()
        }
    }

    if (!argv?.ignoreServer) {
        console.log(chalk.blue('🛠️  [build] packages/server'))

        // build server
        await $`esbuild packages/server/src/index.ts --bundle --format=cjs --minify --keep-names --platform=node --target=node18 --external:fsevents --external:@prisma/client --external:amplify-appsync-simulator --external:_http_common --outfile=dist/server/index.js`.quiet()

        // build server TS Declarations
        await $`cp packages/server/src/index.d.ts dist/server/index.d.ts && chmod -R 755 dist`.quiet()

        // copy server .vtl files into build folder
        await $`cp -R packages/server/src/*.vtl dist/server && chmod -R 755 dist`.quiet()
    }
}
catch (error) {
    console.log(chalk.red(`🚨 [build] error\n\n${error}`))
}
