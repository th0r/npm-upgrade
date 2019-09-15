import {resolve} from 'path';
import {readFileSync} from 'fs';
import libnpmconfig from 'libnpmconfig';
import pacote from 'pacote';

import _ from 'lodash';

export const DEPS_GROUPS = [
  {name: 'production', field: 'dependencies', flag: 'p', ncuValue: 'prod'},
  {name: 'optional', field: 'optionalDependencies', flag: 'o', ncuValue: 'optional'},
  {name: 'development', field: 'devDependencies', flag: 'd', ncuValue: 'dev'},
  {name: 'peer', field: 'peerDependencies', flag: 'r', ncuValue: 'peer'},
  {name: 'bundled', field: 'bundledDependencies', altField: 'bundleDependencies', flag: 'b', ncuValue: 'bundle'}
];

const getNpmConfig = _.memoize(() => {
  const config = {};

  libnpmconfig.read().forEach((value, key) => {
    if (typeof value === 'string') {
      // Replacing env ${VARS} in strings with the `process.env` values
      config[key] = value.replace(/\$\{(.+?)\}/gu, (_, envVar) =>
        process.env[envVar]
      );
    } else {
      config[key] = value;
    }
  });

  return config;
});

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
  for (const {field, altField} of DEPS_GROUPS) {
    let modules = packageJson[field];

    if (!modules && altField) {
      modules = packageJson[altField];
    }

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
  pacote.manifest(moduleName, {
    ...getNpmConfig(),
    'full-metadata': true
  })
);
