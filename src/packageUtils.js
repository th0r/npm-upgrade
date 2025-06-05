import {resolve} from 'path';
import {readFileSync} from 'fs';
import libnpmconfig from 'libnpmconfig';
import pacote from 'pacote';
import shell from 'shelljs';

import _ from 'lodash';
import got from 'got';
import {maxSatisfying, validRange} from 'semver';

export const DEPS_GROUPS = [
  {name: 'global', field: 'dependencies', flag: 'g', ncuValue: 'prod'},
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

export function loadGlobalPackages() {
  const res = shell.exec('npm ls -g --depth 0 --json', {silent: true});
  if (res.code !== 0) {throw new Error(`Could not determine global packages: ${res.stderr}`)}

  try {
    const {dependencies} = JSON.parse(res);
    const content = {dependencies};

    for (const [pkg, {version}] of Object.entries(dependencies)) {content.dependencies[pkg] = version}

    return {content};
  } catch (err) {
    console.error(`Error parsing global packages: ${err.message}`);
    process.exit(1);
  }
}

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
    fullMetadata: true
  })
);

export const getModuleVersions = _.memoize(async moduleName => {
  const moduleData = await got(`https://registry.npmjs.org/${moduleName}/`).json();
  return moduleData.time;
});

// This function returns the publication date of a specific module version.
export const getVersionPublicationDate = _.memoize(async (moduleName, version) => {
  const versions = await getModuleVersions(moduleName);
  const resolvedVersion = maxSatisfying(Object.keys(versions), validRange(version));
  return versions[resolvedVersion] || null;
}, (moduleName, version) => `${moduleName}@${version}`);
