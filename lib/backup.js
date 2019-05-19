const fs = require('fs');

module.exports = async (filepath) => {
    return new Promise((resolve, reject) => {
        fs.copyFile(filepath, filepath + '.bak', err => err ? reject(err) : resolve());
    });
}
