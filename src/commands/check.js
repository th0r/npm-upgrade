import {writeFileSync} from 'fs';

import _ from 'lodash';
import {flow, map, partition} from 'lodash/fp';
import open from 'open';
import semver from 'semver';
import detectIndent from 'detect-indent';
import ncu from 'npm-check-updates';
import shell from 'shelljs';
import {colorizeDiff} from 'npm-check-updates/lib/version-util';

import catchAsyncError from '../catchAsyncError';
import {makeFilterFunction} from '../filterUtils';
import {DEPS_GROUPS, loadGlobalPackages, loadPackageJson, setModuleVersion,
  getModuleInfo, getModuleHomepage, getVersionPublicationDate} from '../packageUtils';
import {fetchRemoteDb, findModuleChangelogUrl} from '../changelogUtils';
import {createSimpleTable} from '../cliTable';
import {strong, success, attention, upgradeCaution, upgradeWarning, upgradeInfo} from '../cliStyles';
import askUser from '../askUser';
import {toSentence, toTimespan} from '../stringUtils';
import {askIgnoreFields} from './ignore';
import Config from '../Config';

const pkg = require('../../package.json');

function createUpdatedModulesTable(modules) {
  return createSimpleTable(
    _.map(modules, ({name, from, to}) => [
      strong(name),
      from, '→', colorizeDiff(from, to)
    ])
  );
}

export const command = 'check [filter]';
export const aliases = '*';
export const describe = 'Check for outdated modules';

export function builder(yargs) {
  DEPS_GROUPS
    .forEach(({name, field, flag}) =>
      yargs.option(name, {
        type: 'boolean',
        alias: flag,
        describe: `check only "${field}"`
      })
    );
}

/* eslint complexity: "off" */
export const handler = catchAsyncError(async opts => {
  const {filter} = opts;

  // Checking all the deps if all of them are omitted
  if (_.every(DEPS_GROUPS, ({name}) => !opts[name])) {
    _.each(DEPS_GROUPS, ({name}) => (opts[name] = true));
    opts.global = false;
  } else if (opts.global) {
    // Make global flag mutually exclusive with other flags
    _.each(DEPS_GROUPS, ({name}) => { opts[name] = false });
    opts.global = true;
  }

  // Loading `package.json` from the current directory
  const {path: packageFile, content: packageJson, source: packageSource} = opts.global ?
    loadGlobalPackages() : loadPackageJson();

  // Fetching remote changelogs db in background
  fetchRemoteDb();

  const depsGroupsToCheck = _.filter(DEPS_GROUPS, ({name}) => !!opts[name]);
  const depsGroupsToCheckStr = (depsGroupsToCheck.length === DEPS_GROUPS.length) ?
    '' : `${toSentence(_.map(depsGroupsToCheck, ({name}) => strong(name)))} `;
  const filteredWith = filter ? `filtered with ${strong(filter)} ` : '';

  console.log(
    `Checking for outdated ${depsGroupsToCheckStr}dependencies ${filteredWith}${opts.global ? '' :
      (`for "${strong(packageFile)}"`)}...`
  );

  const ncuDepGroups = DEPS_GROUPS
    .filter(({name}) => opts[name])
    .map(({ncuValue}) => ncuValue)
    .join(',');
  const filteredPackageJson = filterDepsInPackageJson(packageJson, makeFilterFunction(filter));
  const currentVersions = ncu.getCurrentDependencies(filteredPackageJson, {dep: ncuDepGroups});
  const latestVersions = await ncu.queryVersions(currentVersions, {versionTarget: 'latest', timeout: 0});
  const upgradedVersions = ncu.upgradeDependencies(currentVersions, latestVersions);

  if (_.isEmpty(upgradedVersions)) {
    return console.log(success('All dependencies are up-to-date!'));
  }

  // Getting the list of ignored modules
  const config = new Config();
  config.ignore = config.ignore || {};

  // Making arrays of outdated modules
  const [ignoredModules, modulesToUpdate] = flow(
    map.convert({'cap': false})((newVersion, moduleName) => ({
      name: moduleName,
      from: currentVersions[moduleName],
      to: newVersion
    })),
    partition(module => (
      _.has(config.ignore, module.name) &&
      semver.satisfies(latestVersions[module.name], config.ignore[module.name].versions)
    ))
  )(upgradedVersions);

  // Moving `@types/*` modules right below their original modules
  sortModules(modulesToUpdate);
  sortModules(ignoredModules);

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
      from, '→', colorizeDiff(from, to),
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

    let infoTime = toTimespan(config.recentUpdates?.info ?? '3d');
    let warningTime = toTimespan(config.recentUpdates?.warning ?? '2d');
    let cautionTime = toTimespan(config.recentUpdates?.caution ?? '1d');

    // If timespan are not valid, print an error and set to default values
    if (infoTime < warningTime || infoTime < cautionTime || warningTime < cautionTime) {
      console.error('Invalid timespan values in config.recentUpdates. Using default values.');
      infoTime = toTimespan('3d');
      warningTime = toTimespan('2d');
      cautionTime = toTimespan('1d');
    }

    // This checks if the package was released less than 3 days ago, throws a warning if true
    const publishedDate = new Date(await getVersionPublicationDate(name, to));
    // This is 3 days prior to execution time.
    const recommendedDatePrior = new Date(Date.now() - infoTime);
    const isRecent = publishedDate.getTime() > recommendedDatePrior.getTime();
    if (isRecent) {
      const timeSincePublication = new Date(Date.now()).getTime() - publishedDate.getTime();
      const warningLevel = (isRecent
        && timeSincePublication < cautionTime) ? 'caution'
        : (timeSincePublication < warningTime) ? 'warning'
          : 'info';
      let message = (warningLevel === 'caution')
        ? upgradeCaution('CAUTION') : (warningLevel === 'warning')
          ? upgradeWarning('WARN') : upgradeInfo('INFO');
      message += ` ${name}@${to.replace(
        /[~^]/,
        ''
      )} was released less than ${Math.ceil(
        timeSincePublication / toTimespan('1d')
      )} days ago, be careful when upgrading.`;
      console.log(message);
    }

    const answer = await askUser({
      type: 'list',
      message: `${changelogUrl === undefined ? 'U' : 'So, u'}pdate "${name}" ${opts.global ? 'globally' :
        'in package.json'} from ${from} to ${colorizeDiff(from, to)}?`,
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
          open(changelogUrl);
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
          open(homepage);
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

  if (opts.global) {
    const shouldUpdateGlobalPackages = await askUser(
      {type: 'confirm', message: 'Update global modules?', default: true}
    );

    if (!shouldUpdateGlobalPackages) {return}

    console.log(`Automatically upgrading ${updatedModules.length} module${updatedModules.length !== 1 ? 's' : ''}...`);
    return shell.exec(`npm install --global ${updatedModules.map(({name, to}) => `${name}@${to}`).join(' ')}`);
  }

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

function filterDepsInPackageJson(packageJson, moduleNameFilterFn) {
  const result = _.cloneDeep(packageJson);

  for (const depsGroup of DEPS_GROUPS) {
    const deps = result[depsGroup.field];

    if (deps) {
      for (const moduleName of Object.keys(deps)) {
        if (!moduleNameFilterFn(moduleName)) {
          delete deps[moduleName];
        }
      }
    }
  }

  return result;
}

function sortModules(modules) {
  const processedModules = new Set();

  for (let i = 0, len = modules.length; i < len; i++) {
    const module = modules[i];

    if (processedModules.has(module)) {
      continue;
    }

    const normalizedName = module.name.replace(/^@types\//, '');

    if (module.name === normalizedName) {
      continue;
    }

    // Searching for corresponding module
    const originalModuleIndex = modules.findIndex(({name}) => name === normalizedName);

    if (originalModuleIndex === -1 || i === originalModuleIndex + 1) {
      continue;
    }

    if (originalModuleIndex > i) {
      modules.splice(originalModuleIndex + 1, 0, module);
      modules.splice(i, 1);
      processedModules.add(module);
      i--;
    } else {
      modules.splice(i, 1);
      modules.splice(originalModuleIndex + 1, 0, module);
    }
  }
}
