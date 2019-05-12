const fs = require('fs');

module.exports = (filePath, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, err => {
            if (err) return reject(err);
            resolve();
        });
    });
};
