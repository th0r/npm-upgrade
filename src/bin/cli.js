#! /usr/bin/env node

import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import { white } from 'chalk';
import opener from 'opener';
import ncu from 'npm-check-updates';
import { colorizeDiff } from 'npm-check-updates/lib/version-util';

import { getModuleVersion, setModuleVersion, getModuleInfo, getModuleHomepage } from '../packageUtils';
import { createSimpleTable } from '../cliTable';
import askUser from '../askUser';

const strong = white.bold;

(async function main() {
    const packageFile = path.resolve(process.argv[2] || './package.json');
    let packageJson = require(packageFile);
    console.log(`Checking for outdated modules for "${strong(packageFile)}"...`);
    let updatedModules = await ncu.run({ packageFile });

    if (_.isEmpty(updatedModules)) {
        return console.log(`All dependencies are up-to-date!`);
    }

    // Making array of outdated modules
    updatedModules = _.map(updatedModules, (newVersion, moduleName) => ({
        name: moduleName,
        from: getModuleVersion(moduleName, packageJson),
        to: newVersion
    }));

    // Creating pretty-printed CLI table with update info
    const updatedTable = createSimpleTable(
        _.map(updatedModules, ({ name, from, to }) =>
            [strong(name), from, '→', colorizeDiff(to, from)]
        ),
        {
            style: { 'padding-left': 2 },
            colAligns: ['left', 'right', 'right', 'right']
        }
    );

    console.log(`\nNew versions of modules available:\n\n${updatedTable}`);

    let packageUpdated = false;
    do {
        const outdatedModule = updatedModules.shift();
        const { name, from, to } = outdatedModule;
        let { homepage } = outdatedModule;
        const isHomepageChecked = (homepage !== undefined);
        console.log('');
        const { [name]: answer } = await askUser([{
            type: 'list',
            name,
            message: `${isHomepageChecked ? 'So, u' : 'U'}pdate "${name}" in package.json from ${from} to ${colorizeDiff(to, from)}?`,
            choices: _.compact([
                { name: 'Yes', value: true },
                { name: 'No', value: false },
                // Don't show this option if we haven't found info about homepage in module's package.json
                (homepage !== null) &&
                    { name: 'Open homepage or changelog', value: 'homepage' }
            ]),
            default: 0
        }]);

        if (answer === 'homepage') {
            // Ask user about this module again
            updatedModules.unshift(outdatedModule);

            if (!isHomepageChecked) {
                console.log('Trying to find homepage or changelog URL...');
                homepage = outdatedModule.homepage = getModuleHomepage(await getModuleInfo(name));
            }

            if (homepage) {
                console.log(`Opening ${strong(homepage)}...`);
                opener(homepage);
            } else {
                console.log(`Sorry, there is no info about homepage or changelog URL in the ${strong(name)}'s package.json`);
            }
        } else if (answer === true) {
            packageUpdated = true;
            setModuleVersion(name, to, packageJson);
        }
    } while (updatedModules.length);

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
