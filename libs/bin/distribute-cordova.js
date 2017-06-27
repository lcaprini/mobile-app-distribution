#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const Promise = require('bluebird');
const url = require('url');

const config = require('../config');
const utils = require('../utils');
const repo = require('../repo');
const cordova = require('../cordova').CORDOVA;
const android = require('../android');
const TASKS = require('../cordova').TASKS;

program
    .allowUnknownOption()
    .usage(`<app version> -t <[${TASKS.COMPILE_SOURCES},${TASKS.CHANGE_VERSION},${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID},${TASKS.UPLOAD_BUILDS},${TASKS.UPLOAD_SOURCES},${TASKS.SEND_EMAIL}]> [options]`)
    .option('-p, --config <config>', 'config file for app distribution', config.path)
    .option('-a, --android-version-code <version code>', 'Android version code')
    .option('-i, --ios-bundle-version <bundle version>', 'iOS bundle version')
    .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator', config.changeLog)
    .option(`-t, --tasks <[${TASKS.CHANGE_VERSION},${TASKS.COMPILE_SOURCES},${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID},${TASKS.UPLOAD_BUILDS},${TASKS.UPLOAD_SOURCES},${TASKS.SEND_EMAIL}]>`, `
      ${TASKS.COMPILE_SOURCES} : builds HTML, CSS, JAVASCRIPT files for Cordova projects
      ${TASKS.CHANGE_VERSION} : preprocess file setting app version
      ${TASKS.BUILD_IOS} : builds, archives ad exports iOS project
      ${TASKS.BUILD_ANDROID} : builds, archives ad exports Android project
      ${TASKS.UPLOAD_BUILDS} : uploads builds on remote FTP server
      ${TASKS.UPLOAD_SOURCES} : archives www sources with NodeJS server to test and view
      ${TASKS.SEND_EMAIL}:  send email when finish with URL and QRCode for download`, config.tasks)
    .option('-q, --qr-code', 'print QRCode of repository homepage', config.qrcode)
    .option('-v, --verbose', 'prints all log in console', config.verbose)
    .option('-f, --force', 'force with yes all questions', config.force)
    .option('-h, --hidden', 'hides build in HTML download page', config.hidden)
    .parse(process.argv);

/**
 * Print error and exit process
 * @param {Error} err 
 */
const endDistribute = err => {
    const logger = require('../logger');

    if(err){
        logger.error(err);
        // logger.error(err.message);
        process.exit(1);
    }

    // Close process when uploading and updating repo tasks are completed
    if(utils.isUploadingBuilds() || repo.isUpdatingRepo()){
        Promise.all([utils.UPDATING_REPO, utils.UPLOADING_BUILDS]).then(() => {
            exit();
        });
    }
    else{
        exit();
    }
}

/**
 * Send email, print close message and close process
 */
const exit = () => {
    const logger = require('../logger');

    /**
     * SEND EMAIL
     */
    if(config.tasks.contains(TASKS.SEND_EMAIL)){
        let emailData = {
            appName : config.appName,
            appVersion : config.appVersion,
            appLabel : config.applabel,
            hidden : config.hidden,
            repoHomepageUrl : config.repoHomepageUrl
        }
        if(config.tasks.contains(TASKS.BUILD_ANDROID)){
            emailData.androidBuildPath = url.resolve(config.repoAndroidUrlPath, config.apkFileName);
        }
        if(config.tasks.contains(TASKS.BUILD_IOS)){
            emailData.iosBuildPath = url.resolve(config.repoIOSUrlPath, config.apkFileName);;
        }
        const emailBody = cordova.composeEmail(emailData);
        utils.sendEmail({
            from : config.emailFrom,
            to : config.emailTo,
            server : {
                host : config.emailHost,
                port : config.emailPort,
                user : config.emailUser,
                password : config.emailPassword
            },
            appName : config.appName,
            appVersion : config.appVersion,
            body : emailBody
        });
        utils.SENDING_EMAIL.then(
            () => {
                logger.printEnd();
                if(config.qrcode && config.repoHomepageUrl){
                    utils.printQRCode(config.repoHomepageUrl);
                }
                process.exit(0);
            }
        )
    }
    else{
        logger.printEnd();
        if(config.qrcode && config.repoHomepageUrl){
            utils.printQRCode(config.repoHomepageUrl);
        }
        process.exit(0);
    }
}

/**
 * Start Cordova distribution process
 */
const startDistribution = () => {
    const logger = require('../logger');

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
        }
        /**
         * Set version and name in config.xml
         */
        cordova.setVersion({
            cordovaPath : config.cordovaPath,
            appVersion : config.appVersion
        });

        /**
         * BUILD IOS PLATFORM
         */
        if(config.tasks.contains(TASKS.BUILD_IOS)){
        }

        /**
         * BUILD ANDROID PLATFORM
         */
        if(config.tasks.contains(TASKS.BUILD_ANDROID)){
            cordova.distributeAndroid({
                launcherName : config.appLabel,
                id : config.androidBundleId,
                versionCode : config.androidVersionCode,

                cmdCordovaAndroid : config.cmdCordovaAndroid,
                cordovaPath: config.cordovaPath,
                apkFilePath : config.apkFilePath,
                keystore : {
                    path: config.androidKeystorePath,
                    alias : config.androidKeystoreAlias,
                    password : config.androidKeystorePassword
                },

                verbose : config.verbose
            });
            if(config.tasks.contains(TASKS.UPLOAD_BUILDS)){
                android.uploadAPK({
                    apkFilePath : config.apkFilePath,
                    server : {
                        host : config.ftpBuildsHost,
                        port : config.ftpBuildsPort,
                        user : config.ftpBuildsUser,
                        pass : config.ftpBuildsPassword
                    },
                    apkDestinationPath : config.ftpBuildsAndroidDestinationPath
                });
                android.updateRepository({
                    repoPath : config.ftpRepoJsonPath,
                    server : {
                        host : config.ftpRepoHost,
                        port : config.ftpRepoPort,
                        user : config.ftpRepoUser,
                        pass : config.ftpRepoPassword
                    },
                    androidBuildPath : url.resolve(config.repoAndroidUrlPath, config.apkFileName),
                    version : config.appVersionLabel,
                    changelog : config.changeLog,
                    hidden : config.hidden,
                    rootPath : config.rootPath
                })
            }
        }
        /**
         * BUILD IOS PLATFORM
         */


        endDistribute();
    }
    catch(err){
        endDistribute(err);
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
        endDistribute(err);
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