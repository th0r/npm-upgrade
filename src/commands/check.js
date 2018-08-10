import {writeFileSync} from 'fs';

import _ from 'lodash';
import opener from 'opener';
import semver from 'semver';
import detectIndent from 'detect-indent';
import ncu from 'npm-check-updates';
import {colorizeDiff} from 'npm-check-updates/lib/version-util';

import catchAsyncError from '../catchAsyncError';
import * as npmProgress from '../npmProgress';
import {makeFilterFunction} from '../filterUtils';
import {DEPS_GROUPS, loadPackageJson, setModuleVersion, getModuleInfo, getModuleHomepage} from '../packageUtils';
import {fetchRemoteDb, findModuleChangelogUrl} from '../changelogUtils';
import {createSimpleTable} from '../cliTable';
import {strong, success, attention} from '../cliStyles';
import askUser from '../askUser';
import {askIgnoreFields} from './ignore';
import Config from '../Config';

const pkg = require('../../package.json');

function createUpdatedModulesTable(modules) {
  return createSimpleTable(
    _.map(modules, ({name, from, to}) => [
      strong(name),
      from, '→', colorizeDiff(to, from)
    ])
  );
}

export const command = 'check [filter]';
export const aliases = '*';
export const describe = 'Check for outdated modules';

const depsCliOptions = DEPS_GROUPS.filter(group => group.cliOption);

export function builder(yargs) {
  depsCliOptions
    .forEach(({name, field}) =>
      yargs.option(name, {
        type: 'boolean',
        alias: name[0],
        describe: `check only "${field}"`
      })
    );
}

/* eslint complexity: "off" */
export const handler = catchAsyncError(async opts => {
  const {filter} = opts;
  // Making function that will filter out deps by module name
  const filterModuleName = makeFilterFunction(filter);

  // Checking all the deps if all of them are omitted
  if (_.every(depsCliOptions, ({name}) => opts[name] === false)) {
    _.each(depsCliOptions, ({name}) => (opts[name] = true));
  }

  // Loading `package.json` from the current directory
  const {path: packageFile, content: packageJson, source: packageSource} = loadPackageJson();

  // Fetching remote changelogs db in background
  fetchRemoteDb();

  const depsGroupsToCheck = _.filter(depsCliOptions, ({name}) => !!opts[name]);
  const depsGroupsToCheckStr = (depsGroupsToCheck.length === depsCliOptions.length) ?
    '' : `${_.map(depsGroupsToCheck, 'name').join(' and ')} `;
  const filteredWith = filter ? `filtered with ${strong(filter)} ` : '';

  console.log(
    `Checking for outdated ${depsGroupsToCheckStr}dependencies ${filteredWith}for "${strong(packageFile)}"...`
  );

  await ncu.initialize();
  const currentVersions = ncu.getCurrentDependencies(packageJson, {
    prod: opts.production,
    dev: opts.development,
    optional: opts.optional
  });

  const latestVersions = await ncu.queryVersions(currentVersions, {versionTarget: 'latest'});
  let upgradedVersions = ncu.upgradeDependencies(currentVersions, latestVersions);
  npmProgress.disable();

  // Filtering modules that have to be updated
  upgradedVersions = _.pickBy(
    upgradedVersions,
    (newVersion, moduleName) => filterModuleName(moduleName)
  );

  if (_.isEmpty(upgradedVersions)) {
    return console.log(success('All dependencies are up-to-date!'));
  }

  // Getting the list of ignored modules
  const config = new Config();
  config.ignore = config.ignore || {};

  // Making arrays of outdated modules
  const [ignoredModules, modulesToUpdate] = _(upgradedVersions)
    .map((newVersion, moduleName) => ({
      name: moduleName,
      from: currentVersions[moduleName],
      to: newVersion
    }))
    .partition(module => (
      _.has(config.ignore, module.name) &&
      semver.satisfies(latestVersions[module.name], config.ignore[module.name].versions)
    ))
    .valueOf();

  // Creating pretty-printed CLI tables with update info
  if (_.isEmpty(modulesToUpdate)) {
    console.log(
      success('\nAll active modules are up-to-date!')
    );
  } else {
    console.log(
      `\n${strong('New versions of active modules available:')}\n\n${createUpdatedModulesTable(modulesToUpdate)}`
    );
  }

  if (!_.isEmpty(ignoredModules)) {
    const rows = _.map(ignoredModules, ({name, from, to}) => [
      strong(name),
      from, '→', colorizeDiff(to, from),
      attention(config.ignore[name].versions),
      config.ignore[name].reason
    ]);

    // Adding table header
    rows.unshift(_.map(
      ['', 'From', '', 'To', 'Ignored versions', 'Reason'],
      header => strong(header)
    ));

    console.log(`\n${strong('Ignored updates:')}\n\n${createSimpleTable(rows)}`);
  }

  const updatedModules = [];
  let isUpdateFinished = false;
  while (modulesToUpdate.length && !isUpdateFinished) {
    const outdatedModule = modulesToUpdate.shift();
    const {name, from, to} = outdatedModule;
    let {changelogUrl, homepage} = outdatedModule;

    // Adds new line
    console.log('');

    const answer = await askUser({
      type: 'list',
      message: `${changelogUrl === undefined ? 'U' : 'So, u'}pdate "${name}" in package.json ` +
      `from ${from} to ${colorizeDiff(to, from)}?`,
      choices: _.compact([
        {name: 'Yes', value: true},
        {name: 'No', value: false},
        // Don't show this option if we couldn't find module's changelog url
        (changelogUrl !== null) &&
        {name: 'Show changelog', value: 'changelog'},
        // Show this if we haven't found changelog
        (changelogUrl === null && homepage !== null) &&
        {name: 'Open homepage', value: 'homepage'},
        {name: 'Ignore', value: 'ignore'},
        {name: 'Finish update process', value: 'finish'}
      ]),
      // Automatically setting cursor to "Open homepage" after we haven't found changelog
      default: (changelogUrl === null && homepage === undefined) ? 2 : 0
    });

    switch (answer) {
      case 'changelog':
        // Ask user about this module again
        modulesToUpdate.unshift(outdatedModule);

        if (changelogUrl === undefined) {
          console.log('Trying to find changelog URL...');
          changelogUrl =
            outdatedModule.changelogUrl = await findModuleChangelogUrl(name);
        }

        if (changelogUrl) {
          console.log(`Opening ${strong(changelogUrl)}...`);
          opener(changelogUrl);
        } else {
          console.log(
            `Sorry, we haven't found any changelog URL for ${strong(name)} module.\n` +
            `It would be great if you could fill an issue about this here: ${strong(pkg.bugs.url)}\n` +
            'Thanks a lot!'
          );
        }
        break;

      case 'homepage':
        // Ask user about this module again
        modulesToUpdate.unshift(outdatedModule);

        if (homepage === undefined) {
          console.log('Trying to find homepage URL...');
          homepage = outdatedModule.homepage = getModuleHomepage(await getModuleInfo(name));
        }

        if (homepage) {
          console.log(`Opening ${strong(homepage)}...`);
          opener(homepage);
        } else {
          console.log(`Sorry, there is no info about homepage URL in the ${strong(name)}'s package.json`);
        }
        break;

      case 'ignore': {
        const {versions, reason} = await askIgnoreFields(latestVersions[name]);
        config.ignore[name] = {versions, reason};
        break;
      }

      case 'finish':
        isUpdateFinished = true;
        break;

      case true:
        updatedModules.push(outdatedModule);
        setModuleVersion(name, to, packageJson);
        delete config.ignore[name];
        break;
    }

  }

  // Adds new line
  console.log('');

  // Saving config
  config.save();

  if (!updatedModules.length) {
    console.log('Nothing to update');
    return;
  }

  // Showing the list of modules that are going to be updated
  console.log(
    `\n${strong('These packages will be updated:')}\n\n` +
    createUpdatedModulesTable(updatedModules) +
    '\n'
  );

  const shouldUpdatePackageFile = await askUser(
    {type: 'confirm', message: 'Update package.json?', default: true}
  );

  if (shouldUpdatePackageFile) {
    const {indent} = detectIndent(packageSource);

    writeFileSync(
      packageFile,
      // Adding newline to the end of file
      `${JSON.stringify(packageJson, null, indent)}\n`
    );
  }
});
