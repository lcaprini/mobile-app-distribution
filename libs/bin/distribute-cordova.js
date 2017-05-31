#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');

const config = require('../config');
const utils = require('../utils');
const cordova = require('../cordova').cordova;
const TASKS = require('../cordova').TASKS;

program
    .allowUnknownOption()
    .usage('<app version> -ts <[v,c,i,a,f,j,z,e]>[options]')
    .option('-p, --config <config>', 'config file for app distribution', config.path)
    .option('-a, --android-version-code <version code>', 'Android version code')
    .option('-i, --ios-bundle-version <bundle version>', 'iOS bundle version')
    .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator', config.changeLog)
    .option(`-t, --tasks <[${TASKS.CHANGE_VERSION},${TASKS.COMPILE_SOURCES},${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID},${TASKS.UPLOAD_BUILDS},${TASKS.UPDATE_REPO},${TASKS.UPLOAD_SOURCES},${TASKS.SEND_EMAIL}]>`, `
      ${TASKS.CHANGE_VERSION} : preprocess file setting app version
      ${TASKS.COMPILE_SOURCES} : builds HTML, CSS, JAVASCRIPT files for Cordova projects
      ${TASKS.BUILD_IOS} : builds, archives ad exports iOS project
      ${TASKS.BUILD_ANDROID} : builds, archives ad exports Android project
      ${TASKS.UPLOAD_BUILDS} : uploads builds on remote FTP server
      ${TASKS.UPDATE_REPO} : updates build.json file on remote FTP server
      ${TASKS.UPLOAD_SOURCES} : archives www sources with NodeJS server to test and view
      ${TASKS.SEND_EMAIL}:  send email when finish with URL and QRCode for download`, config.tasks)
    .option('-h, --hidden', 'hides build in HTML download page', config.hidden)
    .option('-v, --verbose', 'prints all log in console', config.verbose)
    .option('-f, --force', 'force with yes all questions', config.force)
    .parse(process.argv);

/**
 * Print error and exit process
 * @param {Error} err 
 */
const quit = err => {
    const logger = require('../logger');

    // logger.error(err);
    logger.error(err.message);
    process.exit(1);
}

/**
 * Start Cordova distribution process
 */
const startDistribution = () => {
    try{
        /**
         * COMPILE SOURCES
         */
        if(config.tasks.contains(TASKS.COMPILE_SOURCES)){
            cordova.compileSource({
                sourcePath : config.sourcePath,
                compileSourcesCmd : config.compileSourcesCmd,
                verbose : config.verbose
            });
            cordova.setVersion({
                cordovaConfigPath : config.cordovaConfigPath,
                appVersion : config.appVersion
            });
        }

        logger.section('Distribution process completed');
        process.exit(0);
    }
    catch(err){
        quit(err);
    }
}

/**
 * Inizialize Cordova distribution process
 */
const initCordova = () => {
    try{
        config.printRecap().then(startDistribution);
    }
    catch(err){
        quit(err);
    }
}

/**
 * Read config file and initialize all distribution process
 */
config.init({
    configPath: program.config,
    program: program
}).then(
    initCordova,
    err => {
        // logger.error(err.message);
        console.error(err);
        program.help();
    }
);