#! /usr/bin/env node

import yargs from 'yargs';

function loadBuilder(modulePath) {
  // yargs builders must be synchronous — async builders break `--help` for the
  // default command. Handlers below use dynamic import() instead.
  // eslint-disable-next-line global-require
  return require(modulePath);
}

yargs
  .command({
    command: 'check [filter]',
    aliases: '*',
    describe: 'Check for outdated modules',
    builder: yargs => loadBuilder('../commands/check').builder(yargs),
    handler: async argv => {
      const {handler} = await import('../commands/check');
      return handler(argv);
    }
  })
  .command({
    command: 'ignore <command>',
    describe: 'Manage ignored modules',
    builder: yargs => loadBuilder('../commands/ignore').builder(yargs)
  })
  .command({
    command: 'changelog <moduleName>',
    describe: 'Show changelog for a module',
    handler: async argv => {
      const {handler} = await import('../commands/changelog');
      return handler(argv);
    }
  })
  .demandCommand()
  .strict()
  .version()
  .help()
  .argv;
