import catchAsyncError from '../../catchAsyncError';
import {createIgnoredModulesTable} from '../ignore';
import Config from '../../Config';

export const command = 'list';
export const describe = 'Show the list of ignored modules';

export const handler = catchAsyncError(async () => {
  const config = new Config();
  console.log(
    `Currently ignored modules:\n\n${createIgnoredModulesTable(config.ignore)}\n`
  );
});
