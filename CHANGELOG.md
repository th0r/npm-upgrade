# Changelog

> **Tags:**
> - [Breaking Change]
> - [New Feature]
> - [Improvement]
> - [Bug Fix]
> - [Internal]
> - [Documentation]

_Note: Gaps between patch versions are faulty, broken or test releases._

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
