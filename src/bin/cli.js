#! /usr/bin/env node

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const ncu = require('npm-check-updates');
const inquirer = require('inquirer');

const DEPS_GROUPS = ['dependencies', 'devDependencies', 'optionalDependencies'];

function findModuleDepsGroup(moduleName, packageJson) {
    for (let group of DEPS_GROUPS) {
        const modules = packageJson[group];

        if (modules && modules[moduleName]) {
            return modules;
        }
    }

    return null;
}

function getModuleVersion(moduleName, packageJson) {
    const depsGroup = findModuleDepsGroup(moduleName, packageJson);

    return depsGroup ? depsGroup[moduleName] : null;
}

function setModuleVersion(moduleName, newVersion, packageJson) {
    const depsGroup = findModuleDepsGroup(moduleName, packageJson);

    if (depsGroup) {
        depsGroup[moduleName] = newVersion;
        return true;
    } else {
        return false;
    }
}

async function askUser(questions) {
    return new Promise(resolve => inquirer.prompt(questions, resolve));
}

(async function main() {
    const packageFile = path.resolve(process.argv[2] || './package.json');
    let packageJson = require(packageFile);
    console.log(`Checking for outdated modules for "${packageFile}"...`);
    const updated = await ncu.run({ packageFile });

    if (_.isEmpty(updated)) {
        return console.log(`All modules are up-to-date!`);
    }

    const updatedList = _(updated)
        .map((newVersion, moduleName) => `${moduleName}: ${newVersion}`)
        .join('\n')
        .valueOf();

    console.log(`New versions of modules available:\n\n${updatedList}\n`);

    const questions = _.map(updated, (newVersion, moduleName) => {
        return {
            type: 'list',
            name: moduleName,
            message: `Update "${moduleName}" from ${getModuleVersion(moduleName, packageJson)} to ${updated[moduleName]}?`,
            choices: [
                { name: 'Yes', value: true },
                { name: 'No', value: false }
            ],
            default: 0
        }
    });

    const answers = await askUser(questions);

    let packageUpdated = false;
    _.each(answers, (shouldUpdate, moduleName) => {
        if (shouldUpdate) {
            packageUpdated = true;
            setModuleVersion(moduleName, updated[moduleName], packageJson);
        }
    });

    // Adds new line
    console.log('');

    if (packageUpdated) {
        packageJson = JSON.stringify(packageJson, null, 2);
        console.log(`New package.json:\n\n${packageJson}\n`);
        const { shouldUpdatePackageFile } = await askUser([
            { type: 'confirm', name: 'shouldUpdatePackageFile', message: 'Update package.json?', default: true }
        ]);

        if (shouldUpdatePackageFile) {
            // Adding newline to the end of file
            fs.writeFileSync(packageFile, `${packageJson}\n`);
        }
    } else {
        console.log('Nothing to update');
    }
})().catch(err => {
    console.error(err.message);
    process.exit(1);
});
