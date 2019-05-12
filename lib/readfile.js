const fs = require('fs');

module.exports = filepath => {
    return new Promise((resolve, reject) => {
        fs.stat(filepath, (err, stats) => {
            if (err) return reject(err);
            if (stats.isDirectory()) return reject(new Error('The path is directory.'));
            fs.readFile(filepath, 'utf8', (err, content) => {
                if (err) return reject(err);
                resolve(content)
            });
        });
    });
};
