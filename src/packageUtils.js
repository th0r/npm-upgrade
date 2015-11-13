import _ from 'lodash';
import npm from 'npm';

const DEPS_GROUPS = ['dependencies', 'devDependencies', 'optionalDependencies'];

export function findModuleDepsGroup(moduleName, packageJson) {
    for (const group of DEPS_GROUPS) {
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
    return packageJson.changelog || packageJson.homepage || packageJson.url || null;
}

export async function getModuleInfo(moduleName) {
    // This function is only supposed to run after `npm-check-updates`, so we don't need to call `npm.load()` here
    return await new Promise((resolve, reject) => {
        try {
            npm.commands.view([moduleName], true, (err, moduleInfo) => {
                if (err) {
                    reject(err);
                } else {
                    // `moduleInfo` contains object `{ <version>: <info> }`, so we should extract info from there
                    resolve(_.values(moduleInfo)[0]);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}