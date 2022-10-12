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
    await $`esbuild packages/client/src/index.ts --bundle --define:process.env.NODE_ENV="production" --format=cjs --minify --keep-names --platform=node --target=node14 --external:fsevents --external:@prisma/client --outfile=dist/prisma-appsync/index.js --legal-comments=inline`

    // build Prisma-AppSync Client TS Declarations
    console.log(chalk.blue('\nBuild :: Client TS Declarations\n'))
    await $`tsc packages/client/src/*.ts --outDir dist/prisma-appsync/ --declaration --emitDeclarationOnly --esModuleInterop`

    // copy Prisma-AppSync Generator template files into build folder
    console.log(chalk.blue('\nBuild :: Generator template files\n'))
    await $`cp -R packages/generator/templates dist/templates && chmod -R 755 dist`

    // build create-app
    console.log(chalk.blue('\nBuild :: Create app\n'))
    await $`esbuild packages/create-app/src/index.ts --bundle --platform=node --target=node14 --external:fsevents --external:_http_common --outfile=dist/create-app.js`

    // build appsync-server
    console.log(chalk.blue('\nBuild :: AppSync-server\n'))
    await $`esbuild packages/appsync-server/src/index.ts --bundle --format=cjs --keep-names --platform=node --target=node14 --external:fsevents --external:_http_common --outfile=dist/appsync-server/index.js`

    // copy AppSync-server Client TS Declarations
    console.log(chalk.blue('\nBuild :: AppSync-server TS Declarations\n'))
    await $`cp packages/appsync-server/src/index.d.ts dist/appsync-server/index.d.ts && cp -R packages/appsync-server/src/gql dist/appsync-server && chmod -R 755 dist`
}
catch (error) {
    console.log(chalk.red(`\nBuild :: Error\n\n${error}`))
}
