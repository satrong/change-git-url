const path = require('path');
const { Input, Invisible } = require('enquirer');
const ora = require('ora');
const { recursive, isExitPath } = require('./recursive');
const readFile = require('./readfile');
const writeFile = require('./writeFile');
const backupFile = require('./backup');
const isWin = process.platform === 'win32';

let defaultDir = '';
let message = 'Input drives(e.g. d:/) or a directory path(e.g. d:/myCode).';
let spinner;
let tempPath = path.join(isWin ? process.env.TEMP : process.env.HOME, '.change-git-url.json'); // store temp file

// macOS 、linux default User Folder
if (!isWin) {
    defaultDir = process.env.HOME;
    message = `Input a directory path, default is ${defaultDir}`;
}

const lastArg = process.argv[process.argv.length - 1];

module.exports = async () => {
    if (['-v', '--version', '-V'].indexOf(lastArg) > -1) {
        return console.log(require(path.join(__dirname, '../package.json')).version);
    }
    try {
        let tempData = {};
        if (await isExitPath(tempPath)) {
            tempData = require(tempPath) || {};
        }

        let dir = await new Input({ message, initial: defaultDir }).run().catch(console.log);
        if (dir === undefined) throw new Error('Has been canceled.');
        if (!dir) throw new Error('The path is empty.');
        dir = dir.trim();
        if (/^[a-z]:$/i) dir += '/';

        if (!path.isAbsolute(dir)) {
            dir = path.join(process.cwd(), dir); // relative path
        }

        let sourceDomain = await new Input({ message: 'Old git domain', initial: tempData.sourceDomain }).run().catch(console.log);
        if (sourceDomain === undefined) throw new Error('has been canceled');
        sourceDomain = sourceDomain.trim();
        if (sourceDomain === '') throw new Error('Old git domain is empty.');

        let targetDomain = await new Input({ message: 'New git domain', initial: tempData.targetDomain }).run();
        if (targetDomain === undefined) throw new Error('has been canceled');
        targetDomain = targetDomain.trim();
        if (targetDomain === '') throw new Error('New git domain is empty.');

        await writeFile(tempPath, JSON.stringify({ sourceDomain, targetDomain })).catch(console.log);

        spinner = ora('searching...').start();
        const gitDirs = await recursive(dir);
        let count = 0;
        for (let i = 0, len = gitDirs.length; i < len; i++) {
            const el = gitDirs[i];
            const filepath = path.join(el, '.git/config');
            await backupFile(filepath); // backup file
            const content = await readFile(filepath);
            const reg = new RegExp(sourceDomain.replace(/\./g, '\\.'), 'g');
            const newContent = content.replace(reg, targetDomain);
            if (content !== newContent) {
                await writeFile(filepath, newContent);
                count++;
                spinner.info(`${count}. ${el}`);
            }
        }
        spinner.succeed(`found and changed ${count} projects`);
        // await new Invisible({ name: 'exit', message: `found and changed ${count} projects, Press Enter key exit` }).run();
    } catch (err) {
        spinner ? spinner.fail(err.message) : ora().fail(err.message);
        // await new Invisible({ name: 'exit', message: 'Press Enter key exit' }).run();
    }
};
