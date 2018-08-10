import {resolve} from 'path';
import {readFileSync} from 'fs';

import _ from 'lodash';
import npm from 'npm';

export const DEPS_GROUPS = [
  {name: 'production', field: 'dependencies', cliOption: true},
  {name: 'optional', field: 'optionalDependencies', cliOption: true},
  {name: 'development', field: 'devDependencies', cliOption: true},
  {name: 'peer', field: 'peerDependencies', cliOption: false}
];

export function loadPackageJson() {
  const packageFile = resolve('./package.json');
  let packageJson;
  let packageSource;

  try {
    packageSource = readFileSync(packageFile, 'utf-8');
    packageJson = JSON.parse(packageSource);
  } catch (err) {
    console.error(`Error loading package.json: ${err.message}`);
    process.exit(1);
  }

  return {path: packageFile, content: packageJson, source: packageSource};
}

export function findModuleDepsGroup(moduleName, packageJson) {
  for (const group of _.map(DEPS_GROUPS, 'field')) {
    const modules = packageJson[group];

    if (modules && modules[moduleName]) {
      return modules;
    }
  }

  return null;
}

export function getModuleVersion(moduleName, packageJson) {
  const depsGroup = findModuleDepsGroup(moduleName, packageJson);

  return depsGroup ? depsGroup[moduleName] : null;
}

export function setModuleVersion(moduleName, newVersion, packageJson) {
  const depsGroup = findModuleDepsGroup(moduleName, packageJson);

  if (depsGroup) {
    depsGroup[moduleName] = newVersion;
    return true;
  } else {
    return false;
  }
}

export function getModuleHomepage(packageJson) {
  return packageJson.homepage || packageJson.url || null;
}

export const getModuleInfo = _.memoize(async moduleName =>
  await new Promise((resolve, reject) => {
    try {
      npm.load({silent: true}, err => {
        if (err) reject(err);
        npm.commands.view([moduleName], true, (err, moduleInfo) => {
          if (err) reject(err);
          // `moduleInfo` contains object `{ <version>: <info> }`, so we should extract info from there
          resolve(_.values(moduleInfo)[0]);
        });
      });
    } catch (err) {
      reject(err);
    }
  })
);
