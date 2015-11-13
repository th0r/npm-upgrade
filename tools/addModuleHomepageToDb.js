#! /usr/bin/env node

var path = require('path');
var fs = require('fs');

var HOMEPAGES_DB_FILE = path.resolve(__dirname, '../db/homepages.json');

var args = process.argv.slice(2);
var moduleName = args[0];
var homepageUrl = args[1];

if (!moduleName || !homepageUrl) {
    console.error('Usage: ./%s <moduleName> <homepageUrl>', path.basename(__filename));
    process.exit();
}

var homepages = require(HOMEPAGES_DB_FILE);

homepages[moduleName] = homepageUrl;

// Sorting keys in alphabetic order
homepages = Object.keys(homepages)
    .sort()
    .reduce(function (newHomepages, moduleName) {
        newHomepages[moduleName] = homepages[moduleName];
        return newHomepages;
    }, {});

fs.writeFileSync(HOMEPAGES_DB_FILE, JSON.stringify(homepages, null, 4));

console.log('Homepage for "%s" module set to "%s"', moduleName, homepageUrl);
