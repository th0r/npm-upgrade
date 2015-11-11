const DEPS_GROUPS = ['dependencies', 'devDependencies', 'optionalDependencies'];

export function findModuleDepsGroup(moduleName, packageJson) {
    for (let group of DEPS_GROUPS) {
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