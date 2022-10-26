const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const ORIG_PKG_PATH = path.resolve(__dirname, '../../package.json')
const BACKUP_PKG_PATH = path.resolve(__dirname, '../../package-beforePublish.json')
const RESTORE_PKG_PATH = path.resolve(__dirname, '../../package-afterPublish.json')

// Obtain original `package.json` contents.
const pkgData = require(ORIG_PKG_PATH)

// Write/cache the original `package.json` data to `package-beforePublish.json` file.
fs.writeFile(BACKUP_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
    if (err)
        throw err
})

// Write/cache the original `package.json` data to `package-afterPublish.json` file.
fs.writeFile(RESTORE_PKG_PATH, JSON.stringify(pkgData, null, 4), (err) => {
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
