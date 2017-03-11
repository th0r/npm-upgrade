#! /usr/bin/env node

const path = require('path');
const fs = require('fs');

const CHANGELOG_URLS_DB_FILE = path.resolve(__dirname, '../db/changelogUrls.json');

const args = process.argv.slice(2);
const moduleName = args[0];
const changelogUrl = args[1];

if (!moduleName || !changelogUrl) {
  console.error(`Usage: ./${path.basename(__filename)} <moduleName> <changelogUrl>`);
  process.exit();
}

let changelogUrls = require(CHANGELOG_URLS_DB_FILE);

changelogUrls[moduleName] = changelogUrl;

// Sorting keys in alphabetic order
changelogUrls = Object.keys(changelogUrls)
  .sort()
  .reduce(function (newChangelogUrls, moduleName) {
    newChangelogUrls[moduleName] = changelogUrls[moduleName];
    return newChangelogUrls;
  }, {});

fs.writeFileSync(CHANGELOG_URLS_DB_FILE, JSON.stringify(changelogUrls, null, 4) + '\n');

console.log(`Changelog URL for "${moduleName}" module set to "${changelogUrl}"`);
