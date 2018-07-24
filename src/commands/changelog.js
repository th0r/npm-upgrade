import opener from 'opener';

import catchAsyncError from '../catchAsyncError';
import {findModuleChangelogUrl} from '../changelogUtils';
import {strong} from '../cliStyles';
const pkg = require('../../package.json');

export const command = 'changelog <moduleName>';
export const describe = 'Show changelog for a module';

export const handler = catchAsyncError(async opts => {
  const {moduleName} = opts;

  console.log(`Trying to find changelog URL for ${strong(moduleName)}...`);
  let changelogUrl;
  try {
    changelogUrl = await findModuleChangelogUrl(moduleName);
  } catch (err) {
    if (err.code === 'E404') {
      console.log("Couldn't find info about this module in npm registry");
      return;
    }
  }

  if (changelogUrl) {
    console.log(`Opening ${strong(changelogUrl)}...`);
    opener(changelogUrl);
  } else {
    console.log(
      "Sorry, we haven't found any changelog URL for this module.\n" +
      `It would be great if you could fill an issue about this here: ${strong(pkg.bugs.url)}\n` +
      'Thanks a lot!'
    );
  }
});
