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
const cordova = require('../cordova').CORDOVA;
const android = require('../android');
const ios = require('../ios');
const TASKS = require('../cordova').TASKS;

let iosBuildProcessCompleted;
let androidBuildProcessCompleted;
let sourcesUploadProcessCompleted;

program
    .allowUnknownOption()
    .usage(`<app-version> -t <[${TASKS.COMPILE_SOURCES},${TASKS.CHANGE_VERSION},${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID},${TASKS.UPLOAD_BUILDS},${TASKS.UPLOAD_SOURCES},${TASKS.SEND_EMAIL}]> [options]`)
    .option('-p, --config <config-path>', 'config file for app distribution', config.path)
    .option('-a, --android-version-code <version-code>', 'Android version code')
    .option('-i, --ios-bundle-version <bundle-version>', 'iOS bundle version')
    .option('-c, --change-log <change-log.txt or "First edit***Other edit...">', 'file path or list with "***" separator', config.changeLog)
    .option(`-t, --tasks <[${TASKS.CHANGE_VERSION},${TASKS.COMPILE_SOURCES},${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID},${TASKS.UPLOAD_BUILDS},${TASKS.UPLOAD_SOURCES},${TASKS.SEND_EMAIL}]>`, `
      ${TASKS.CHANGE_VERSION} : changes app version editing the config.xml of Cordova project
      ${TASKS.COMPILE_SOURCES} : compiles HTML, Javascript, CSS files into www folder
      ${TASKS.BUILD_IOS} : builds, exports and signs iOS platform into ipa file
      ${TASKS.BUILD_ANDROID} : builds, exports and signs Android platform into apk file
      ${TASKS.UPLOAD_BUILDS} : uploads builds on remote FTP server
      ${TASKS.UPLOAD_SOURCES} : uploads sources of Cordova www folder
      ${TASKS.SEND_EMAIL}:  sends email when finished with URL and QRCode for download`, config.tasks)
    .option('-q, --qr-code', 'prints QRCode of repository homepage', config.qrcode)
    .option('-v, --verbose', 'prints all logs in console', config.verbose)
    .option('-f, --force', 'forces with yes all questions', config.force)
    .option('-u, --unsigned', 'skip jarsigner and zipalign on Android build', config.unsigned)
    .option('-h, --hidden', 'hides build in HTML download page', config.hidden)
    .parse(process.argv);

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

    // Close process when uploading and updating repo tasks are completed for all platforms
    Promise.all([
        iosBuildProcessCompleted,
        androidBuildProcessCompleted,
        sourcesUploadProcessCompleted
    ]).then(
        () => {
            finalize();
        },
        () => {
            process.exit(1);
        });
};

/**
 * Send email, print close message and close process
 */
const finalize = () => {
    const logger = require('../logger');

    let finalRepoHomepageUrl = `${config.remote.repo.homepageUrl}?v=${config.app.versionLabel}`;
    if (config.hidden) {
        finalRepoHomepageUrl += '&all=true';
    }

    /**
     * SEND EMAIL
     */
    if (config.tasks.contains(TASKS.SEND_EMAIL)) {
        let emailData = {
            appName: config.app.name,
            appLabel: config.app.label,
            appVersion: config.app.versionLabel,
            changelog: config.changeLog,
            releaseDate: config.releaseDate,
            repoHomepageUrl: finalRepoHomepageUrl
        };
        if (config.tasks.contains(TASKS.BUILD_ANDROID)) {
            emailData.androidBuildPath = config.remote.repo.androidUrlPath;
        }
        if (config.tasks.contains(TASKS.BUILD_IOS)) {
            emailData.iosBuildPath = config.remote.repo.iosManifestUrlPath;
        }
        const emailBody = cordova.composeEmail(emailData);
        email.sendEmail({
            from: config.email.from,
            to: config.email.to,
            server: {
                host: config.email.host,
                port: config.email.port,
                user: config.email.user,
                password: config.email.password
            },
            appName: config.app.name,
            appVersion: config.app.versionLabel,
            body: emailBody
        });
        email.SENDING_EMAIL.then(
            () => {
                logger.printEnd();
                if (config.qrcode && config.remote.repo.homepageUrl) {
                    utils.printQRCode(finalRepoHomepageUrl);
                }
                process.exit(0);
            }
        );
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
         * CHANGE VERSION
         */
        if (config.tasks.contains(TASKS.CHANGE_VERSION)) {
            cordova.changeVersion({
                filePath: config.sources.htmlVersionPath,
                version: config.app.versionLabel
            });
        }

        /**
         * COMPILE SOURCES
         */
        if (config.tasks.contains(TASKS.COMPILE_SOURCES)) {
            cordova.compileSource({
                sourcePath: config.sources.compilePath,
                compileSourcesCmd: config.sources.compileCommand,

                verbose: config.verbose
            });
        }

        /**
         * Set version and name in config.xml
         */
        cordova.setVersion({
            cordovaPath: config.cordova.path,
            appVersion: config.app.version
        });

        /**
         * BUILD IOS PLATFORM
         */
        if (!config.tasks.contains(TASKS.BUILD_IOS)) {
            iosBuildProcessCompleted = Promise.resolve();
        }
        else {
            iosBuildProcessCompleted = new Promise((resolve, reject) => {
                cordova.distributeIos({
                    appName: config.app.name,
                    displayName: config.app.label,
                    ipaFileName: config.ios.ipaFileName,
                    id: config.ios.bundleId,
                    version: config.app.version,
                    bundleVersion: config.ios.bundleVersion,
                    buildWorkspace: config.ios.buildWorkspace,
                    schema: config.ios.targetSchema,

                    infoPlistPath: config.ios.infoPlistPath,
                    cordovaPath: config.cordova.path,
                    buildIosCommand: config.cordova.buildIosCommand,
                    exportOptionsPlist: config.ios.exportOptionsPlist,
                    exportOptionsPlistPath: config.ios.exportOptionsPlistPath,
                    exportDir: config.buildsDir,

                    ipaUrlPath: config.remote.repo.iosIpaUrlPath,
                    manifestPath: path.join(config.buildsDir, config.ios.manifestFileName),

                    verbose: config.verbose
                });

                if (!config.tasks.contains(TASKS.UPLOAD_BUILDS)) {
                    resolve();
                }
                else {
                    ios.uploadManifestAndIPA({
                        ipaFilePath: config.ios.ipaFilePath,
                        manifestFilePath: config.ios.manifestFilePath,
                        server: {
                            host: config.remote.builds.host,
                            port: config.remote.builds.port,
                            user: config.remote.builds.user,
                            pass: config.remote.builds.password
                        },
                        destinationPath: config.remote.builds.iosDestinationPath
                    }).then(() => {
                        remote.updateRepo({
                            repoPath: config.remote.repo.jsonPath,
                            server: {
                                host: config.remote.repo.host,
                                port: config.remote.repo.port,
                                user: config.remote.repo.user,
                                pass: config.remote.repo.password
                            },
                            iosBuildPath: config.remote.repo.iosManifestUrlPath,
                            version: config.app.versionLabel,
                            changelog: config.changeLog,
                            releaseDate: config.releaseDate,
                            hidden: config.hidden,
                            rootPath: config.rootPath
                        }).then(resolve, reject);
                    }, reject);
                }
            });
        }

        /**
         * BUILD ANDROID PLATFORM
         */
        if (!config.tasks.contains(TASKS.BUILD_ANDROID)) {
            androidBuildProcessCompleted = Promise.resolve();
        }
        else {
            androidBuildProcessCompleted = new Promise((resolve, reject) => {
                iosBuildProcessCompleted.then(
                    () => {
                        cordova.distributeAndroid({
                            launcherName: config.app.label,
                            id: config.android.bundleId,
                            versionCode: config.android.versionCode,

                            cordovaPath: config.cordova.path,
                            buildAndroidCommand: config.cordova.buildAndroidCommand,

                            apkFilePath: config.android.apkFilePath,
                            keystore: {
                                path: config.android.keystore.path,
                                alias: config.android.keystore.alias,
                                password: config.android.keystore.password
                            },
                            unsigned: config.unsigned,

                            verbose: config.verbose
                        });

                        if (!config.tasks.contains(TASKS.UPLOAD_BUILDS)) {
                            resolve();
                        }
                        else {
                            android.uploadAPK({
                                apkFilePath: config.android.apkFilePath,
                                server: {
                                    host: config.remote.builds.host,
                                    port: config.remote.builds.port,
                                    user: config.remote.builds.user,
                                    pass: config.remote.builds.password
                                },
                                destinationPath: config.remote.builds.androidDestinationPath
                            }).then(() => {
                                remote.updateRepo({
                                    repoPath: config.remote.repo.jsonPath,
                                    server: {
                                        host: config.remote.repo.host,
                                        port: config.remote.repo.port,
                                        user: config.remote.repo.user,
                                        pass: config.remote.repo.password
                                    },
                                    androidBuildPath: config.remote.repo.androidUrlPath,
                                    version: config.app.versionLabel,
                                    changelog: config.changeLog,
                                    releaseDate: config.releaseDate,
                                    hidden: config.hidden,
                                    rootPath: config.rootPath
                                }).then(resolve, reject);
                            }, reject);
                        }
                    }
                );
            });
        }

        /**
         * UPLOAD SOURCES
         */
        if (!config.tasks.contains(TASKS.UPLOAD_SOURCES)) {
            sourcesUploadProcessCompleted = Promise.resolve();
        }
        else {
            let processes = [];
            if (config.tasks.contains(TASKS.BUILD_IOS)) {
                processes.push(iosBuildProcessCompleted);
            }
            if (config.tasks.contains(TASKS.BUILD_ANDROID)) {
                processes.push(androidBuildProcessCompleted);
            }
            // Start upload when all other upload processes end
            sourcesUploadProcessCompleted = Promise.all(processes).then(
                () => {
                    return remote.uploadSources({
                        archiveFilePath: config.remote.sources.archiveFilePath,
                        sourceSrcPath: path.join(config.cordova.path, './www'),
                        server: {
                            host: config.remote.sources.host,
                            port: config.remote.sources.port,
                            user: config.remote.sources.user,
                            pass: config.remote.sources.password
                        },
                        sourceDestPath: config.remote.sources.sourcesPath
                    });
                },
                () => {
                    process.exit(1);
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
config.init({
    configPath: program.config,
    program: program
}).then(
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
