#!/usr/bin/env node
'use strict';
require('../protos');
const program = require('commander');
const Promise = require('bluebird');
const path = require('path');

const config = require('../config');
const utils = require('../utils');
const email = require('../email');
const remote = require('../remote');
const angular = require('../angular').ANGULAR;
const TASKS = require('../angular').TASKS;

let deployBuildProcessCompleted;
let upploadRepoProcessCompleted;

program
  .allowUnknownOption()
  .usage(`<app-version> -t <[${TASKS.CHANGE_VERSION},${TASKS.BUILD},${TASKS.DEPLOY_BUILD},${TASKS.UPLOAD_REPO},${TASKS.SEND_EMAIL}]> [options]`)
  .option('-p, --config <config-path>', 'config file for app distribution', config.path)
  .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator', config.changeLog)
  .option(`-t, --tasks <[${TASKS.CHANGE_VERSION},${TASKS.BUILD},${TASKS.DEPLOY_BUILD},${TASKS.UPLOAD_REPO},${TASKS.SEND_EMAIL}]>`,
    `${TASKS.CHANGE_VERSION} : changes app version editing the file specified by the distribute config
      ${TASKS.BUILD} : build sources
      ${TASKS.DEPLOY_BUILD} : deploy build to remote FTP server
      ${TASKS.UPLOAD_REPO} : uploads build on remote repository FTP server
      ${TASKS.SEND_EMAIL}:  sends email when finished with URL and QRCode for download`,
    config.tasks
  )
  .option('-q, --qr-code', 'prints QRCode of repository homepage', config.qrcode)
  .option('-v, --verbose', 'prints all logs in console', config.verbose)
  .option('-f, --force', 'forces with yes all questions', config.force)
  .option('-h, --hidden', 'hides build in HTML download page', config.hidden)
  .parse(process.argv);

/*
TODO:
    1- gestire il replace della versione su un file che non esiste
    2- gestire il caso in cui i task angular e cordova corrispondono
    3- gestire l'esistenza della buildDir nel nei task di deploy e repo
*/

/**
 * Print error and exit process
 * @param {Error} err
 */
const endDistribute = err => {
    const logger = require('../logger');

    if (err) {
    // logger.error(err);
        logger.error(err.message);
        process.exit(1);
    }

  // Close process when uploading and updating repo tasks are completed
    Promise.all([upploadRepoProcessCompleted, deployBuildProcessCompleted]).then(
    () => {
        finalize();
    },
    () => {
        process.exit(1);
    }
  );
};

/**
 * Send email, print close message and close process
 */
const finalize = () => {
    const logger = require('../logger');

    let finalRepoHomepageUrl = `${config.remote.repo.homepageUrl}?v=${
    config.app.versionLabel
  }`;
    if (config.hidden) {
        finalRepoHomepageUrl += '&all=true';
    }

  /**
   * SEND EMAIL
   */
    if (config.tasks.contains(TASKS.SEND_EMAIL)) {
        let emailData = {
            appName         : config.app.name,
            appLabel        : config.app.label,
            appVersion      : config.app.versionLabel,
            changelog       : config.changeLog,
            releaseDate     : config.releaseDate,
            repoHomepageUrl : finalRepoHomepageUrl
        };

        if (config.tasks.contains(TASKS.BUILD_ANDROID)) {
            emailData.androidBuildPath = config.remote.repo.androidUrlPath;
        }
        if (config.tasks.contains(TASKS.BUILD_IOS)) {
            emailData.iosBuildPath = config.remote.repo.iosManifestUrlPath;
        }
        const emailBody = angular.composeEmail(emailData);
        email.sendEmail({
            from   : config.email.from,
            to     : config.email.to,
            server : {
                host     : config.email.host,
                port     : config.email.port,
                user     : config.email.user,
                password : config.email.password
            },
            appName    : config.app.name,
            appVersion : config.app.versionLabel,
            body       : emailBody
        });
        email.SENDING_EMAIL.then(() => {
            logger.printEnd();
            if (config.qrcode && config.remote.repo.homepageUrl) {
                utils.printQRCode(finalRepoHomepageUrl);
            }
            process.exit(0);
        });
    }
    else {
        logger.printEnd();
        if (config.qrcode && config.remote.repo.homepageUrl) {
            utils.printQRCode(finalRepoHomepageUrl);
        }
        process.exit(0);
    }
};

/**
 * Start Cordova distribution process
 */
const startDistribution = () => {
    try {
        /**
         * BUILD SOURCES
         */
        if (config.tasks.contains(TASKS.BUILD)) {
            angular.build({
                sourcePath      : config.sources.sourcePath,
                buildSourcesCmd : config.sources.buildCommand,

                verbose : config.verbose
            });
        }

        /**
         * CHANGE VERSION
         */
        if (config.tasks.contains(TASKS.CHANGE_VERSION)) {
            angular.changeVersion({
                filePath     : config.sources.updateVersion.filePath,
                version      : config.app.versionLabel,
                replacingTag : config.sources.updateVersion.replacingTag
            });
        }

        /**
         * DEPLOY BUILD
         */
        if (!config.tasks.contains(TASKS.DEPLOY_BUILD)) {
            deployBuildProcessCompleted = Promise.resolve();
        }
        else {
            // Start upload
            deployBuildProcessCompleted = remote.uploadFolder({
                folderSourcePath : path.join(config.buildsDir),
                folderDestPath   : config.remote.builds.angularDestinationPath,
                server           : {
                    host : config.remote.builds.host,
                    port : config.remote.builds.port,
                    user : config.remote.builds.user,
                    pass : config.remote.builds.password
                }
            });
        }

        /**
         * UPLOAD REPO
         */
        if (!config.tasks.contains(TASKS.UPLOAD_REPO)) {
            upploadRepoProcessCompleted = Promise.resolve();
        }
        else {
            // Start upload
            upploadRepoProcessCompleted = new Promise((resolve, reject) => {
                remote.uploadArchivie({
                    archiveFilePath : config.remote.sources.archiveFilePath,
                    sourceSrcPath   : path.join(config.buildsDir),
                    server          : {
                        host : config.remote.repo.host,
                        port : config.remote.repo.port,
                        user : config.remote.repo.user,
                        pass : config.remote.repo.password
                    },
                    sourceDestPath : config.remote.repo.buildsPath
                }).then(
                    res => {
                        remote.updateRepo({
                            repoPath : config.remote.repo.jsonPath,
                            server   : {
                                host : config.remote.repo.host,
                                port : config.remote.repo.port,
                                user : config.remote.repo.user,
                                pass : config.remote.repo.password
                            },
                            angularBuildPath : config.remote.repo.angularUrlPath,
                            version          : config.app.versionLabel,
                            changelog        : config.changeLog,
                            releaseDate      : config.releaseDate,
                            hidden           : config.hidden,
                            rootPath         : config.rootPath
                        }).then(resolve, reject);
                    },
                    reject
                );
            });
        }

        endDistribute();
    }
    catch (err) {
        endDistribute(err);
    }
};

/**
 * Read config file and initialize all distribution process
 */
config
  .angularInit({
      configPath : program.config,
      program    : program
  })
  .then(
    () => {
        try {
            config.printRecap().then(startDistribution);
        }
        catch (err) {
            endDistribute(err);
        }
    },
    err => {
        console.error(err.message);
        // console.error(err);
        program.help();
    }
  );
