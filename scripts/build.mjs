#!/usr/bin/env zx
import './env.mjs'

try {
    // cleanup previous generated files
    console.log(chalk.blue('Build :: Cleanup\n'))
    await $`rm -rf dist`

    // build Prisma-AppSync Generator
    console.log(chalk.blue('\nBuild :: Generator\n'))
    await $`esbuild packages/generator/src/index.ts --bundle --format=cjs --keep-names --platform=node --target=node14 --external:fsevents --external:_http_common --outfile=dist/generator.js`

    // build Prisma-AppSync Client
    console.log(chalk.blue('\nBuild :: Client\n'))
    await $`esbuild packages/client/src/index.ts --bundle --define:process.env.NODE_ENV="production" --format=cjs --minify --keep-names --platform=node --target=node14 --external:fsevents --external:@prisma/client --outfile=dist/client/index.js --legal-comments=inline`

    // build Prisma-AppSync Client TS Declarations
    console.log(chalk.blue('\nBuild :: Client TS Declarations\n'))
    await $`tsc packages/client/src/*.ts --outDir dist/client/ --declaration --emitDeclarationOnly --esModuleInterop`

    // copy Prisma-AppSync Generator template files into build folder
    console.log(chalk.blue('\nBuild :: Generator template files\n'))
    await $`cp -R packages/generator/templates dist/templates && chmod -R 755 dist`

    // build installer
    console.log(chalk.blue('\nBuild :: Create app\n'))
    await $`esbuild packages/installer/src/index.ts --bundle --define:process.env.NODE_ENV="production" --format=cjs --minify --keep-names --platform=node --target=node14 --external:fsevents --external:_http_common --outfile=dist/installer/bin/index.js`

    // copy server files
    console.log(chalk.blue('\nBuild :: AppSync-server\n'))
    await $`cp -R packages/server/src dist/server && chmod -R 755 dist`
}
catch (error) {
    console.log(chalk.red(`\nBuild :: Error\n\n${error}`))
}
