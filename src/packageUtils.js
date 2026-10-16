import {resolve} from 'path';
import {readFileSync} from 'fs';
import {execFileSync, spawnSync} from 'child_process';
import libnpmconfig from 'libnpmconfig';

import _ from 'lodash';

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
  let stdout;

  try {
    stdout = execFileSync('npm', ['ls', '-g', '--depth', '0', '--json'], {
      encoding: 'utf8'
    });
  } catch (err) {
    // `npm ls` often exits non-zero when the tree has warnings; stdout may still be valid JSON.
    if (err.stdout) {
      stdout = Buffer.isBuffer(err.stdout) ? err.stdout.toString('utf8') : err.stdout;
    } else {
      throw new Error(`Could not determine global packages: ${err.stderr || err.message}`);
    }
  }

  try {
    const {dependencies} = JSON.parse(stdout);
    const content = {dependencies};

    for (const [pkg, {version}] of Object.entries(dependencies)) {content.dependencies[pkg] = version}

    return {content};
  } catch (err) {
    console.error(`Error parsing global packages: ${err.message}`);
    process.exit(1);
  }
}

export function installGlobalPackages(packageSpecs) {
  const result = spawnSync('npm', ['install', '--global', ...packageSpecs], {
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  return result.status;
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

export const getModuleInfo = _.memoize(async moduleName => {
  // Lazy-load pacote so light paths (e.g. Config / ignore list) do not pay for it.
  // eslint-disable-next-line global-require
  const pacote = require('pacote');

  return pacote.manifest(moduleName, {
    ...getNpmConfig(),
    fullMetadata: true
  });
});
