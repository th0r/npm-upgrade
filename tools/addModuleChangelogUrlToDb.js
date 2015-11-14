#! /usr/bin/env node

var path = require('path');
var fs = require('fs');

var CHANGELOG_URLS_DB_FILE = path.resolve(__dirname, '../db/changelogUrls.json');

var args = process.argv.slice(2);
var moduleName = args[0];
var changelogUrl = args[1];

if (!moduleName || !changelogUrl) {
    console.error('Usage: ./%s <moduleName> <changelogUrl>', path.basename(__filename));
    process.exit();
}

var changelogUrls = require(CHANGELOG_URLS_DB_FILE);

changelogUrls[moduleName] = changelogUrl;

// Sorting keys in alphabetic order
changelogUrls = Object.keys(changelogUrls)
    .sort()
    .reduce(function (newChangelogUrls, moduleName) {
        newChangelogUrls[moduleName] = changelogUrls[moduleName];
        return newChangelogUrls;
    }, {});

fs.writeFileSync(CHANGELOG_URLS_DB_FILE, JSON.stringify(changelogUrls, null, 4));

console.log('Changelog URL for "%s" module set to "%s"', moduleName, changelogUrl);
