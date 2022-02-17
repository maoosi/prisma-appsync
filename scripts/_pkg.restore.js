const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const ORIG_PKG_PATH = path.resolve(__dirname, '../package.json')
const CACHED_PKG_PATH = path.resolve(__dirname, '../package-cache.json')

// Obtain original/cached contents from `cached-package.json`.
const pkgData = JSON.stringify(require(CACHED_PKG_PATH), null, 4) + '\n'

// Write data from `cached-package.json` back to original `package.json`.
fs.writeFile(ORIG_PKG_PATH, pkgData, function (err) {
    if (err) throw err
})

// Delete the temporary `cached-package.json` file.
fs.unlink(CACHED_PKG_PATH, function (err) {
    if (err) throw err
})
