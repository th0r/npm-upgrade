#! /usr/bin/env node

import fs from 'fs'
import path from 'path'

import _ from 'lodash'
import ncu from 'npm-check-updates'
import { white } from 'chalk'
import { colorizeDiff } from 'npm-check-updates/lib/version-util';

import { getModuleVersion, setModuleVersion } from '../packageUtils'
import { createSimpleTable } from '../cliTable'
import askUser from '../askUser'

(async function main() {
    const packageFile = path.resolve(process.argv[2] || './package.json');
    let packageJson = require(packageFile);
    console.log(`Checking for outdated modules for "${packageFile}"...`);
    let updated = await ncu.run({ packageFile });

    if (_.isEmpty(updated)) {
        return console.log(`All modules are up-to-date!`);
    }

    // Replacing new versions to `{ from: ..., to: ... }` object
    updated = _.mapValues(updated, (newVersion, moduleName) => ({
        from: getModuleVersion(moduleName, packageJson),
        to: newVersion
    }));

    // Creating pretty-printed CLI table with update info
    const updatedTable = createSimpleTable(
        _.map(updated, ({ from, to }, moduleName) =>
            [white.bold(moduleName), from, '→', colorizeDiff(to, from)]
        ),
        {
            style: { 'padding-left': 2 },
            colAligns: ['left', 'right', 'right', 'right']
        }
    );

    console.log(`\nNew versions of modules available:\n\n${updatedTable}\n`);

    const questions = _.map(updated, ({ from, to }, moduleName) => {
        return {
            type: 'list',
            name: moduleName,
            message: `Update "${moduleName}" in package.json from ${from} to ${colorizeDiff(to, from)}?`,
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
            setModuleVersion(moduleName, updated[moduleName].to, packageJson);
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
        console.log('All dependencies are up-to-date');
    }
})().catch(err => {
    console.error(err.message);
    process.exit(1);
});
