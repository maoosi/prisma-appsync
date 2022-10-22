const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const SRC_PKG_PATH = path.resolve(__dirname, '../../packages/server/package.json')
const DEST_PKG_PATH = path.resolve(__dirname, '../../dist/server/package.json')

// Obtain original `package.json` contents.
const pkgData = require(SRC_PKG_PATH)

// Remove all scripts from the scripts section.
delete pkgData.scripts

// Remove private tag
delete pkgData.private

// Create new `package.json` with new data (i.e. minus the specific data).
fs.writeFile(DEST_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
    if (err)
        throw err
})
