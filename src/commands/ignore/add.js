import _ from 'lodash';
import {Separator} from 'inquirer';

import catchAsyncError from '../../catchAsyncError';
import askUser from '../../askUser';
import {strong, success, attention} from '../../cliStyles';
import {createIgnoredModulesTable, askIgnoreFields} from '../ignore';
import Config from '../../Config';
import {DEPS_GROUPS, loadPackageJson, getModuleVersion} from '../../packageUtils';

export const command = 'add [module]';
export const describe = 'Add module to ignored list';

export const handler = catchAsyncError(async (opts) => {
  let {module: moduleName} = opts;
  const config = new Config();
  config.ignore = config.ignore || {};

  console.log(
    `Currently ignored modules:\n\n${createIgnoredModulesTable(config.ignore)}\n`
  );

  if (moduleName && !getModuleVersion(moduleName, loadPackageJson().content)) {
    console.log(attention(
      `Couldn't find module ${strong(moduleName)} in ${strong('package.json')}. Choose existing module.\n`
    ));
    moduleName = null;
  }

  let ignoreMore;
  do {
    if (!moduleName) {
      moduleName = await askUser({
        type: 'list',
        message: 'Select module to ignore:',
        choices: makeModulesToIgnoreList(config.ignore),
        pageSize: 20
      });
    }

    config.ignore[moduleName] = await askIgnoreFields('*');
    config.save();

    console.log(
      success(`\nModule ${strong(moduleName)} added to ignored list.\n`)
    );
    moduleName = null;

    ignoreMore = await askUser({
      message: 'Do you want to ignore some other module?',
      type: 'confirm'
    });
  } while (ignoreMore);
});

function makeModulesToIgnoreList(ignoredModulesConfig) {
  const {content: packageJson} = loadPackageJson();
  const ignoredModules = _.keys(ignoredModulesConfig);

  return _.transform(DEPS_GROUPS, (list, group) => {
    const groupModules = _.keys(packageJson[group.field]);
    const availableToIgnore = _.difference(groupModules, ignoredModules);

    if (availableToIgnore.length) {
      list.push(
        new Separator(strong(`--- ${group.field} ---`)),
        ...availableToIgnore
      );
    }
  });
}
