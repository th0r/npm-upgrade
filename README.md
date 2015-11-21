# npm-upgrade
Interactive CLI utility to easily update outdated NPM dependencies

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]

## What is this for?
If you are tired of manually upgrading `package.json` every time your package dependencies are getting out of date then this utility is for you.

Take a look at this demo:

![npm-upgrade outdated packages](https://cloud.githubusercontent.com/assets/302213/11168821/08311b90-8bb2-11e5-9a71-5da73682ed44.gif)

## Installation
First, install [Node.js](https://nodejs.org) (at least `v0.10`).

Then install this utility as global npm-module:
```sh
npm i -g npm-upgrade
```

## Usage
Run `npm-upgrade [options] [filter]` in the root directory of your Node.js project (it must contain `package.json` that you want to update):
```sh
cd ~/my-projects/my-node-project
npm-upgrade
```
Utility will find all of your outdated deps and ask to update them in `package.json`. Just answer the questions and you are done.

If you want to check only some deps, you can use `filter` argument:
```sh
# Will check only `babel-core`:
npm-upgrade babel-core

# Will check all the deps with `babel` in the name:
npm-upgrade '*babel*'

# Note quotes around `filter`. They are necessary because without them bash may interpret `*` as wildcard character.

# Will check all the deps, excluding any with `babel` in the name:
npm-upgrade '!*babel*'

# You can combine including and excluding rules:
npm-upgrade '*babel* !babel-transform-* !babel-preset-*'

```

Use `Ctrl-C` to exit if you changed your mind.

## Options
```
-h, --help         output usage information
-V, --version      output the version number
-p, --production   Check only "dependencies"
-d, --development  Check only "devDependencies"
-o, --optional     Check only "optionalDependencies"
```

## Troubleshooting
**Wrong changelog shown for _\<moduleName\>_ or not shown at all!**

Yes, It can happen sometimes. This is because there is no standardized way to specify changelog location for the module, so it tries to guess it, using these rules one by one:

1. Check `db/changelogUrls.json` from `master` branch on GitHub or the local copy if it's unreachable.
2. Check `changelog` field from module's `package.json`.
3. Parse module's `repository.url` field and if it's on GitHub, try to request some common changelog files (`CHANGELOG.md`, `History.md` etc.) from `master` branch and if it fails, open `Releases` page.

So, if it guessed wrong it would be great if you could either [fill an issue](../../issues/new) about this or submit a PR which adds proper changelog URL to `db/changelogUrls.json`. There is a tool in the repository for you to make it as easy as possible:
```sh
./tools/addModuleChangelogUrlToDb.js <moduleName> <changelogUrl>
```

## License

[MIT](LICENSE)

[downloads-image]: https://img.shields.io/npm/dt/npm-upgrade.svg
[npm-url]: https://www.npmjs.com/package/npm-upgrade
[npm-image]: https://img.shields.io/npm/v/npm-upgrade.svg
