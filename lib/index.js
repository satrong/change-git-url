const path = require('path');
const { Input, Invisible } = require('enquirer');
const ora = require('ora');
const { recursive, isExitPath } = require('./recursive');
const readFile = require('./readfile');
const writeFile = require('./writeFile');

let defaultDir = '';
let message = 'Input drives(e.g. d:) or a directory path(e.g. d:/myCode).';

// macOS 、linux 默认显示用户目录
if (process.platform !== 'win32') {
    defaultDir = process.env.HOME;
    message = `Input a directory path, default is ${defaultDir}`;
}

(async () => {
    let tempData = {};
    if (await isExitPath('./temp.json')) {
        tempData = require('../temp.json') || {};
    }

    let dir = await new Input({ message, initial: defaultDir }).run().catch(console.log);
    if (dir === undefined) return console.log('Has been canceled.');
    if (!dir) return console.log('The path is empty.');
    dir = dir.trim();

    if (!path.isAbsolute(dir)) {
        dir = path.join(__dirname, dir)
    }

    let sourceDomain = await new Input({ message: 'Old git domain', initial: tempData.sourceDomain }).run().catch(console.log);
    if (sourceDomain === undefined) return console.log('has been canceled');
    sourceDomain = sourceDomain.trim();

    let targetDomain = await new Input({ message: 'New git domain', initial: tempData.targetDomain }).run();
    if (targetDomain === undefined) return console.log('has been canceled');
    targetDomain = targetDomain.trim();

    await writeFile('./temp.json', JSON.stringify({ sourceDomain, targetDomain })).catch(console.log);

    const spinner = ora('searching...').start();

    try {
        const gitDirs = await recursive(dir);
        let count = 0;
        for (let i = 0, len = gitDirs.length; i < len; i++) {
            const el = gitDirs[i];
            const filepath = path.join(el, '.git/config');
            const content = await readFile(filepath);
            const reg = new RegExp(sourceDomain.replace(/\./g, '\\.'), 'g');
            const newContent = content.replace(reg, targetDomain);
            if (content !== newContent) {
                await writeFile(filepath, newContent);
                count++;
                spinner.info(`${count}. ${el}`);
            }
        }
        await new Invisible({ name: 'exit', message: `found and changed ${count} projects, Press Enter key exit` }).run();
    } catch (err) {
        spinner.fail(err.message);
        await new Invisible({ name: 'exit', message: 'Press Enter key exit' }).run();
    }
})();
