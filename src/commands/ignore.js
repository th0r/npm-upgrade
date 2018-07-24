import _ from 'lodash';
import semver from 'semver';

import askUser from '../askUser';
import {createSimpleTable} from '../cliTable';
import {strong, attention} from '../cliStyles';

export const command = 'ignore <command>';
export const describe = 'Manage ignored modules';
export const builder = yargs =>
  yargs
    .commandDir('ignore')
    .demandCommand(1, 'Provide valid command');

export function createIgnoredModulesTable(ignoredModulesConfig, moduleNames = _.keys(ignoredModulesConfig)) {
  const rows = moduleNames.map(moduleName => [
    strong(moduleName),
    attention(ignoredModulesConfig[moduleName].versions),
    ignoredModulesConfig[moduleName].reason
  ]);

  // Table header
  rows.unshift(['', 'Ignored versions', 'Reason'].map(header => strong(header)));

  return createSimpleTable(rows, {colAligns: 'lcl'});
}

export async function askIgnoreFields(defaultVersions) {
  return {
    versions: await askUser({
      message: 'Input version or version range to ignore',
      default: defaultVersions,
      validate: input => (semver.validRange(input) ? true : 'Input valid semver version range')
    }),
    reason: await askUser({message: 'Ignore reason'})
  };
}
