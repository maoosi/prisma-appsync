const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const SRC_PKG_PATH = path.resolve(__dirname, '../../packages/installer/package.json')
const DEST_PKG_PATH = path.resolve(__dirname, '../../dist/installer/package.json')

// Obtain original `package.json` contents.
const pkgData = require(SRC_PKG_PATH)

// Remove all scripts from the scripts section.
delete pkgData.scripts

// Remove all pkgs from the dependencies section.
delete pkgData.dependencies

// Remove all pkgs from the devDependencies section.
delete pkgData.devDependencies

// Remove private tag
delete pkgData.private

// Overwrite original `package.json` with new data (i.e. minus the specific data).
fs.writeFile(DEST_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
    if (err)
        throw err
})
