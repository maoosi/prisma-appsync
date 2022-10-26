const fs = require('fs')
const path = require('path')

// Define absolute paths for original pkg and temporary pkg.
const ORIG_PKG_PATH = path.resolve(__dirname, '../../package.json')
const BACKUP_PKG_PATH = path.resolve(__dirname, '../../package-beforePublish.json')
const RESTORE_PKG_PATH = path.resolve(__dirname, '../../package-afterPublish.json')

// Obtain original/cached contents (with new version) from `package-afterPublish`.
const pkgData = `${JSON.stringify(require(RESTORE_PKG_PATH), null, 4)}\n`

// Write data from `package-afterPublish` back to original `package.json`.
fs.writeFile(ORIG_PKG_PATH, pkgData, (err) => {
    if (err)
        throw err
})

// Delete the temporary `package-beforePublish` file.
fs.unlink(BACKUP_PKG_PATH, (err) => {
    if (err)
        throw err
})

// Delete the temporary `package-afterPublish` file.
fs.unlink(RESTORE_PKG_PATH, (err) => {
    if (err)
        throw err
})
