const path = require('path');
const fs = require('fs');

// check the path for exist
const isExitPath = async dir => {
    return new Promise(resolve => {
        fs.stat(dir, err => resolve(!err));
    })
};

// check the dir for exist
const isDir = dir => {
    return new Promise(resolve => {
        fs.stat(dir, (err, stats) => {
            if (err) {
                resolve(false);
            } else {
                resolve(stats.isDirectory());
            }
        })
    })
};

// check the git repository for exist
const isIncludeGitDir = async dir => {
    return await isDir(dir) && await isDir(path.join(dir, '.git')) && await isExitPath(path.join(dir, '.git/config')) && await isExitPath(path.join(dir, '.git/HEAD'));
};

const recursive = (dir, gitDirs = []) => {
    if (!isDir(dir)) {
        return Promise.reject(new Error('Invalid path'));
    }
    return new Promise(async (resolve, reject) => {
        if (await isIncludeGitDir(dir)) {
            gitDirs.push(dir);
            resolve(gitDirs);
        } else {
            fs.readdir(dir, async (err, files) => {
                if (err) {
                    // console.log(err.message);
                    return reject(err);
                }
                for (let i = 0, len = files.length; i < len; i++) {
                    const el = files[i];
                    const _dir = path.join(dir, el);
                    if (await isDir(_dir)) {
                        await recursive(_dir, gitDirs);
                    }
                }
                resolve(gitDirs);
            });
        }
    });
};

exports.recursive = recursive;

exports.isDir = isDir;

exports.isExitPath = isExitPath;

exports.isIncludeGitDir = isIncludeGitDir;
