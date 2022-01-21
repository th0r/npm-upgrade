# Changelog

> **Tags:**
> - [Breaking Change]
> - [New Feature]
> - [Improvement]
> - [Bug Fix]
> - [Internal]
> - [Documentation]

_Note: Gaps between patch versions are faulty, broken or test releases._

## 3.1.0
* **New Feature**
  * `--global` flag that allows to upgrade global packages ([#70](https://github.com/th0r/npm-upgrade/pull/70), [@Medallyon](https://github.com/Medallyon))

## 3.0.0
 * **Breaking Change**
   * Drop support for Node.js <= 10.19

 * **Internal**
   * Update deps

## 2.0.4
 * **Internal**
   * Use `open` package instead of `opener` ([#52](https://github.com/th0r/npm-upgrade/pull/52), [@cascornelissen](https://github.com/cascornelissen))

## 2.0.3
 * **Internal**
   * Update deps

## 2.0.2
 * **Bug Fix**
   * Fix handling of dependency group flags (`--production`, `--development` etc.)

## 2.0.1
 * **Improvement**
   * Use indentation from `package.json` for `.npm-upgrade.json` ([#36](https://github.com/th0r/npm-upgrade/pull/36), [@cascornelissen](https://github.com/cascornelissen))

## 2.0.0
 * **Breaking Change**
   * Drop support for Node.js <= 8.10

 * **Improvement**
   * Show `@types/*` packages right below their corresponding modules (closes #32)

 * **Internal**
   * Update deps

## 1.4.1
 * **Improvement**
   * Preserve indentation in `package.json` (#21, @cascornelissen)

## 1.4.0
 * **Internal**
   * Update deps

## 1.3.0
 * **New Feature**
   * Show list of packages that will be updated in the end of upgrade process (#18)

 * **Internal**
   * Drop support for Node 4
   * Update deps

## 1.2.0
 * **Internal**
   * Update deps

## 1.1.0
 * **New Feature**
   * Added `changelog` command

 * **Internal**
   * Update deps

## 1.0.4
 * **Bug Fix**
   * Fix Node 8 compatibility issue

 * **Internal**
   * Use `prepare` npm script instead of `prepublish`
   * Update `inquirer`

## 1.0.2
 * **Bug Fix**
   * Fix `ignore reset` command
   * Remove irrelevant `webpack` changelog url from db

 * **Internal**
   * Use `babel-preset-env` instead of `babel-preset-es2015`
   * Update deps

## 1.0.1
 * **New Feature**
   * Ignore modules feature

 * **Internal**
   * Update deps

## 0.7.0
 * **New Feature**
   * Ability to finish upgrade process on every step

 * **Bug Fix**
   * Fix npm loader shown during upgrade process

## 0.6.2
 * **Bug Fix**
   * Fixes #5: Changelogs do not work anymore

## 0.6.1
 * **Improvement**
   * Add `CHANGELOG` to the list of common changelog files

## 0.6.0
 * **New Feature**
   * Added `filter` CLI argument (see [Usage](README.md#usage) section in `README.md`)

 * **Internal**
   * Update deps

## 0.5.1
 * **Bug Fix**
   * Fixed URL to the issues page for the "couldn't find the changelog" message
   * Fixed detection of the repository's "Releases" page on GitHub if it contains dot in the name

## 0.5.0
 * **New Feature**
   * CLI options added to only check for specified groups of dependencies (see [Options](README.md#options) section in `README.md`)

## 0.4.4
 * **Bug Fix**
   * Fixed bug with requesting remote changelog URLs database

## 0.4.3
 * **Breaking Change**
   * Changelog URLs database have been moved from `data/homepages.json` to `db/changelogUrls.json`

 * **Improvement**
   * Utility now tries to find changelog URL for modules hosted on GitHub.
    It will check for some common changelog filenames like `CHANGELOG.md`, `History.md` etc. and
    open them in browser if they are present in the repository.
    If not, it will open project's `releases` page.

 * **New Feature**
   * Added dev CLI utility to easily add module's changelog URL to the database (`tools/addModuleChangelogUrlToDb.js`).
    Run it without arguments for more info.

## 0.3.0
 * **New Feature**
   * Option to open module's homepage or changelog during update process.

## 0.2.0
 * **New Feature**
   * Colorize new/old module versions diff.

 * **Internal**
   * Split code into ES2015 modules.
