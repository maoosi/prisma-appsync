#!/usr/bin/env zx

try {
    // cleanup previous generated files
    console.log(chalk.blue('Build :: Cleanup\n'))
    await $`rm -rf dist && rm -rf test/generated`

    // build Prisma-AppSync Generator
    console.log(chalk.blue('\nBuild :: Generator\n'))
    await $`esbuild packages/generator/index.ts --bundle --platform=node --external:fsevents --external:_http_common --outfile=dist/generator.js`

    // build Prisma-AppSync Client
    console.log(chalk.blue('\nBuild :: Client\n'))
    await $`esbuild packages/client/index.ts --bundle --define:process.env.NODE_ENV="production" --format=cjs --minify --keep-names --metafile=meta.json --platform=node --external:fsevents --external:@prisma/client --outfile=dist/prisma-appsync/index.js`

    // build Prisma-AppSync Client TS Declarations
    console.log(chalk.blue('\nBuild :: TS Declarations\n'))
    await $`tsc packages/client/*.ts --outDir dist/prisma-appsync/ --declaration --emitDeclarationOnly  --esModuleInterop`

    // copy Prisma-AppSync Generator template files into build folder
    console.log(chalk.blue('\nBuild :: Generator template files\n'))
    await $`cp -R packages/generator/templates dist/templates && chmod -R 755 dist`
} catch (error) {
    console.log(chalk.red('\nBuild :: Error\n\n' + error))
}
