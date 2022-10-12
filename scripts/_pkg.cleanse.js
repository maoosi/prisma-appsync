const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const ORIG_PKG_PATH = path.resolve(__dirname, '../package.json')
const PUBLISH_PKG_PATH = path.resolve(__dirname, '../package-publish.json')
const CACHED_PKG_PATH = path.resolve(__dirname, '../package-cache.json')

// Obtain original `package.json` contents.
const pkgData = require(ORIG_PKG_PATH)

// Write/cache the original `package.json` data to `cached-package.json` file.
fs.writeFile(CACHED_PKG_PATH, JSON.stringify(pkgData), (err) => {
    if (err)
        throw err
})

// Remove all scripts from the scripts section.
delete pkgData.scripts

// Remove all pkgs from the devDependencies section.
delete pkgData.devDependencies

// Remove pnpm engine
delete pkgData.engines.pnpm

// Overwrite original `package.json` with new data (i.e. minus the specific data).
fs.writeFile(ORIG_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
    if (err)
        throw err
})

// Publish package is saved for debugging purpose
fs.writeFile(PUBLISH_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
    if (err)
        throw err
})
