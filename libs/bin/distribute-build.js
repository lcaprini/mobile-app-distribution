#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');

const logger = require('../logger');
const config = require('../config');
const utils = require('../utils');
const cordova = require('../cordova').cordova;
const cordovaTasks = require('../cordova').tasks;


program
    .allowUnknownOption()
    .usage('<app version> -ts <[v,c,i,a,f,j,z,e]>[options]')
    .option('-p, --config <config>', 'config file for app distribution', config.path)
    // .option('-l, --app-version-label <version>', 'app version label')
    .option('-a, --android-version-code <version code>', 'Android version code')
    .option('-i, --ios-bundle-version <bundle version>', 'iOS bundle version')
    .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator', config.changeLog)
    .option(`-t, --tasks <[${cordovaTasks.CHANGE_VERSION},${cordovaTasks.COMPILE_SOURCES},${cordovaTasks.BUILD_IOS},${cordovaTasks.BUILD_ANDROID},${cordovaTasks.UPLOAD_BUILDS},${cordovaTasks.UPDATE_REPO},${cordovaTasks.UPLOAD_SOURCES},${cordovaTasks.SEND_EMAIL}]>`, `
      ${cordovaTasks.CHANGE_VERSION} : preprocess file setting app version
      ${cordovaTasks.COMPILE_SOURCES} : builds HTML, CSS, JAVASCRIPT files for Cordova projects
      ${cordovaTasks.BUILD_IOS} : builds, archives ad exports iOS project
      ${cordovaTasks.BUILD_ANDROID} : builds, archives ad exports Android project
      ${cordovaTasks.UPLOAD_BUILDS} : uploads builds on remote FTP server
      ${cordovaTasks.UPDATE_REPO} : updates build.json file on remote FTP server
      ${cordovaTasks.UPLOAD_SOURCES} : archives www sources with NodeJS server to test and view
      ${cordovaTasks.SEND_EMAIL}:  send email when finish with URL and QRCode for download`, config.tasks)
    .option('-h, --hidden', 'hides build in HTML download page', config.hidden)
    .option('-v, --verbose', 'prints all log in console', config.verbose)
    .option('-f, --force', 'force with yes all questions', config.force)
    .parse(process.argv);

// Read and initialize config file
config.init({
    configPath: program.config,
    program: program
}).then(
    () => {
        // logger.debug(config);
        if(config.tasks.contains(cordovaTasks.COMPILE_SOURCES)){
            cordova.build();
        }
    },
    err => {
        // logger.error(err.message);
        logger.error(err);
        // program.help();
    }
);