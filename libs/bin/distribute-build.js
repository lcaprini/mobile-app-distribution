#!/usr/bin/env node
'use strict';

const program = require('commander');

const logger = require('../logger');
const config = require('../config');
const utils = require('../utils');


program
    .allowUnknownOption()
    .usage('<app version> -ts <[v,c,i,a,f,j,z,e]>[options]')
    .option('-p, --config <config>', 'config file for app distribution', 'distribute.json')
    .option('-l, --app-version-label <version>', 'app version label')
    .option('-a, --android-version-code <version code>', 'Android version code')
    .option('-i, --ios-bundle-version <bundle version>', 'iOS bundle version')
    .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator')
    .option('-t, --tasks <[v,c,i,a,f,j,z,e]>', `
      v : preprocess file seting app version
      c : builds HTML, CSS, JAVSCRIPT files for Cordova projects
      i : builds, archives ad exports iOS project
      a : builds, archives ad exports Android project
      f : uploads builds on remote FTP server
      j : updates build.json file on remote FTP server
      z : archives www sources with NodeJS server to test and view
      e:  send email when finish with URL and QRCode for download`)
    .option('-h, --hidden', 'hides build in HTML download page')
    .option('-v, --verbose', 'prints all log in console')
    .option('-f, --force', 'force with yes all questions')
    .parse(process.argv);

// Check if app version exist
const appVersion = program.args[0];
if (!appVersion) {
    program.help();
}
config.setAppVersion(appVersion);

// Read and initialize config file
config.init({
    configPath: program.config,
    program: program
}).then(
    () => {
        utils.printRecap();
    },
    err => {
        logger.error(err)
    }
);