'use strict';

const asciimo = require('asciimo').Figlet;
const Promise = require('bluebird');
const url = require('url');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const path = require('path');
const findVersions = require('find-versions');

const logger = require('./logger');
const utils = require('./utils');
const cordovaTasks = require('./cordova').TASKS;
const cordova = require('./cordova').CORDOVA;
const angularTasks = require('./angular').TASKS;
const angular = require('./angular').ANGULAR;
const android = require('./android');
const ios = require('./ios');
const remote = require('./remote');
const email = require('./email');
const moment = require('moment');

class Config {
    constructor() {
        this.verbose = false;
        this.force = false;
        this.hidden = false;
        this.qrcode = false;

        this.path = 'distribute.json';
        this.rootPath = '';
        this.tasks = 'vciafjze';

        this.changeLog = 'No changelog';
        this.releaseDate = moment().format('DD/MM/YYYY HH:mm');

        this.app = {
            name         : '',
            label        : '',
            version      : '',
            versionLabel : ''
        };

        this.sources = {
            compileCommand  : '',
            compilePath     : '',
            htmlVersionPath : ''
        };

        this.cordova = {
            path                : '',
            configPath          : '',
            rootPath            : '',
            buildIosCommand     : 'cordova build ios',
            buildAndroidCommand : 'cordova build --release android'
        };

        this.buildsDir = 'builds/';

        this.ios = {
            bundleId           : '',
            bundleVersion      : '',
            ipaFileName        : '',
            ipaFilePath        : '',
            infoPlistPath      : '',
            targetSchema       : '',
            exportOptionsPlist : {
                method         : 'enterprise',
                teamID         : '',
                uploadSymbols  : false,
                compileBitcode : false,
                uploadBitcode  : false
            },
            exportOptionsPlistPath : '',
            manifestFileName       : '',
            manifestFilePath       : ''
        };

        this.android = {
            bundleId    : '',
            versionCode : '',
            keystore    : {
                path     : '',
                alias    : '',
                password : ''
            }
        };

        this.remote = {

            builds : {
                host                   : '',
                port                   : 21,
                user                   : '',
                password               : '',
                iosDestinationPath     : '',
                androidDestinationPath : '',
                angularDestinationPath : ''
            },

            repo : {
                host               : '',
                port               : 21,
                user               : '',
                password           : '',
                jsonPath           : '',
                iosUrlPath         : '',
                iosIpaUrlPath      : '',
                iosManifestUrlPath : '',
                androidUrlPath     : '',
                angularUrlPath     : '',
                homepageUrl        : ''
            },

            sources : {
                host            : '',
                port            : 21,
                user            : '',
                sourcesPath     : '',
                archiveFilePath : ''
            }
        };

        this.email = {
            host     : '',
            port     : 25,
            user     : '',
            password : '',
            from     : '',
            to       : []
        };
    }

    init({configPath, program}) {
        let config = this;

        return new Promise((resolve, reject) => {
            fs.readFileAsync(configPath, 'utf8').then(
                fileData => {
                    try {
                        // Verify and set app version
                        config.setBuildVersion(program);

                        const configData = JSON.parse(fileData);

                        // Set all configurations from JSON
                        _.merge(config, configData);

                        // Set project root dir
                        config.rootPath = (path.isAbsolute(configPath)) ? path.dirname(configPath) : process.cwd();
                        // Calculate and set other dirs
                        config.sources.compilePath = path.isAbsolute(config.sources.compilePath) ? config.sources.compilePath : path.join(config.rootPath, config.sources.compilePath);
                        config.sources.htmlVersionPath = path.isAbsolute(config.sources.htmlVersionPath) ? config.sources.htmlVersionPath : path.join(config.rootPath, config.sources.htmlVersionPath);
                        config.cordova.path = path.isAbsolute(config.cordova.rootPath) ? config.cordova.rootPath : path.join(config.rootPath, config.cordova.rootPath);
                        config.cordova.configPath = path.join(config.cordova.path, './config.xml');
                        config.buildsDir = path.isAbsolute(config.buildsDir) ? config.buildsDir : path.join(config.rootPath, config.buildsDir);

                        config.android.keystore.path = path.isAbsolute(config.android.keystore.path) ? config.android.keystore.path : path.join(config.rootPath, config.android.keystore.path);
                        config.android.apkFileName = `${config.app.label}_v.${config.app.versionLabel}.apk`.replace(/ /g, '_');
                        config.android.apkFilePath = path.join(config.buildsDir, config.android.apkFileName);

                        config.ios.ipaFileName = `${config.app.label}_v.${config.app.versionLabel}.ipa`.replace(/ /g, '_');
                        config.ios.ipaFilePath = path.join(config.buildsDir, config.ios.ipaFileName);
                        config.ios.manifestFileName = `manifest_${config.app.label}_v.${config.app.versionLabel}.plist`.replace(/ /g, '_');
                        config.ios.manifestFilePath = path.join(config.buildsDir, config.ios.manifestFileName);
                        if (config.ios.infoPlistPath) {
                            config.ios.infoPlistPath = path.isAbsolute(config.ios.infoPlistPath) ? config.ios.infoPlistPath : path.join(config.rootPath, config.ios.infoPlistPath);
                        }
                        if (config.ios.exportOptionsPlistPath) {
                            config.ios.exportOptionsPlistPath = path.isAbsolute(config.ios.exportOptionsPlistPath) ? config.ios.exportOptionsPlistPath : path.join(config.rootPath, config.ios.exportOptionsPlistPath);
                        }
                        if (!config.ios.targetSchema) {
                            config.ios.targetSchema = config.app.name;
                        }

                        config.remote.repo.jsonPath = path.join(config.remote.repo.jsonPath, './builds.json');
                        config.remote.repo.iosUrlPath = config.remote.repo.iosUrlPath.trim();
                        if (config.remote.repo.iosUrlPath.slice(-1) !== '/') {
                            config.remote.repo.iosUrlPath = config.remote.repo.iosUrlPath + '/';
                        }
                        config.remote.repo.iosIpaUrlPath = url.resolve(config.remote.repo.iosUrlPath, config.ios.ipaFileName);
                        config.remote.repo.iosManifestUrlPath = url.resolve(config.remote.repo.iosUrlPath, config.ios.manifestFileName);
                        config.remote.repo.androidUrlPath = config.remote.repo.androidUrlPath.trim();
                        if (config.remote.repo.androidUrlPath.slice(-1) !== '/') {
                            config.remote.repo.androidUrlPath = config.remote.repo.androidUrlPath + '/';
                        }
                        config.remote.repo.androidUrlPath = url.resolve(config.remote.repo.androidUrlPath, config.android.apkFileName);
                        config.remote.repo.homepageUrl = config.remote.repo.homepageUrl.trim();
                        if (config.remote.repo.homepageUrl.slice(-1) !== '/') {
                            config.remote.repo.homepageUrl = config.remote.repo.homepageUrl + '/';
                        }

                        let archiveFileName = `./${config.app.label}_v.${config.app.versionLabel}.zip`.replace(/ /g, '_');
                        config.remote.sources.archiveFilePath = path.join(config.buildsDir, archiveFileName);
                        config.remote.sources.sourcesPath = path.join(config.remote.sources.sourcesPath, archiveFileName);

                        logger.setFileLogger(config.rootPath);

                        // Set task list
                        config.tasks = program.tasks.split('');

                        // Set verbose mode
                        config.verbose = (_.isBoolean(program.verbose)) ? program.verbose : false;

                        // Set force mode
                        config.force = (_.isBoolean(program.force)) ? program.force : false;

                        // Set qrcode print
                        config.qrcode = (_.isBoolean(program.qrCode)) ? program.qrCode : false;

                        config.readChangeLog(program.changeLog, (err, next) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            try {
                                config.cordovaVerify();
                                resolve();
                            }
                            catch (e) {
                                reject(e);
                            }
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                err => {
                    reject(err);
                }
            );
        });
    }

    angularInit({configPath, program}) {
        let config = this;

        return new Promise((resolve, reject) => {
            fs.readFileAsync(configPath, 'utf8').then(
                fileData => {
                    try {
                        // Verify and set app version
                        config.setBuildVersion(program);

                        const configData = JSON.parse(fileData);

                        // Set all configurations from JSON
                        _.merge(config, configData);

                        // Set project root dir
                        config.rootPath = (path.isAbsolute(configPath)) ? path.dirname(configPath) : process.cwd();
                        // Calculate and set other dirs
                        config.sources.compilePath = path.isAbsolute(config.sources.compilePath)
                            ? config.sources.compilePath
                            : path.join(config.rootPath, config.sources.compilePath);

                        config.sources.updateVersion.filePath = path.isAbsolute(config.sources.updateVersion.filePath)
                            ? config.sources.updateVersion.filePath
                            : path.join(config.rootPath, config.sources.updateVersion.filePath);

                        config.buildsDir = path.isAbsolute(config.buildsDir)
                            ? config.buildsDir
                            : path.join(config.rootPath, config.buildsDir);

                        config.remote.repo.jsonPath = path.join(config.remote.repo.jsonPath, './builds.json');
                        config.remote.repo.homepageUrl = config.remote.repo.homepageUrl.trim();
                        if (config.remote.repo.homepageUrl.slice(-1) !== '/') {
                            config.remote.repo.homepageUrl = config.remote.repo.homepageUrl + '/';
                        }

                        config.remote.repo.buildsPath = config.remote.repo.buildsPath.trim();
                        if (config.remote.repo.buildsPath.slice(-1) !== '/') {
                            config.remote.repo.buildsPath = config.remote.repo.buildsPath + '/';
                        }

                        let archiveFileName = `./${config.app.label}_v.${config.app.versionLabel}.zip`.replace(/ /g, '_');
                        config.remote.sources.archiveFilePath = url.resolve(path.join(config.buildsDir, '../'), archiveFileName);
                        // config.remote.sources.sourcesPath = path.join(config.remote.sources.sourcesPath, archiveFileName);
                        config.remote.repo.angularUrlPath = url.resolve(config.remote.repo.angularUrlPath, archiveFileName);

                        logger.setFileLogger(config.rootPath);

                        // Set task list
                        config.tasks = program.tasks.split('');

                        // Set verbose mode
                        config.verbose = (_.isBoolean(program.verbose)) ? program.verbose : false;

                        // Set force mode
                        config.force = (_.isBoolean(program.force)) ? program.force : false;

                        // Set qrcode print
                        config.qrcode = (_.isBoolean(program.qrCode)) ? program.qrCode : false;

                        config.readChangeLog(program.changeLog, (err, next) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            try {
                                config.angularVerify();
                                resolve();
                            }
                            catch (e) {
                                reject(e);
                            }
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                },
                err => {
                    reject(err);
                }
            );
        });
    }

    /**
     * Verifies app version and calculates app label,
     * iOS Bundle Identifier and Android Version Code
     * @param {Object} program
     */
    setBuildVersion(program) {
        let version = findVersions(program.args[0], {loose : true});
        if (!version[0]) {
            throw new Error('Invalid build version format: please, see http://semver.org');
        }

        // Set app version
        this.app.version = version[0].split('-')[0];

        // Set app version label from program args
        this.app.versionLabel = program.args[0];

        // Set Android Version Code
        this.android.versionCode = (program.androidVersionCode) ? program.androidVersionCode : android.calculateVersionCode(this.app.version);

        // Set iOS Bundle Version
        this.ios.bundleVersion = (program.iosBundleVersion) ? program.iosBundleVersion : ios.calculateBundleVersion(this.app.version);

        // Set if builds are hidden on wireless distribution html page
        if (_.isBoolean(program.hidden)) {
            this.hidden = program.hidden;
        };

        if (this.hidden) {
            this.app.versionLabel += '_DEV';
        }
    }

    readChangeLog(changeLog, next) {
        let config = this;
        let changeLogPath = changeLog;

        /**
         * Read changelog from file
         * @param {String} changelog
         */
        const readFile = changelog => {
            return fs.readFileAsync(changelog, 'utf8').then(
                changeLogText => {
                    config.changeLog = _.filter(changeLogText.split('\n'), line => {
                        line = line.trim();
                        if (line !== '') {
                            return line;
                        }
                    });
                    next();
                },
                () => {
                    readText(changelog);
                });
        };

        /**
         * Read changelog from string
         * @param {String} changelog
         */
        const readText = changelog => {
            config.changeLog = changelog.split('***');
            next();
        };

        if (!fs.existsSync(changeLogPath)) {
            changeLogPath = path.join(config.rootPath, changeLogPath);
            if (!fs.existsSync(changeLogPath)) {
                readText(changeLog);
            }
            else {
                readFile(changeLogPath);
            }
        }
        else {
            readFile(changeLogPath);
        }
    }

    /**
     * Verifies all angular configuration and params
     */
    angularVerify() {
        // Check params for change version task
        if (this.tasks.contains(angularTasks.CHANGE_VERSION)) {
            angular.verifyVersionConfigs(this);
        }

        // Check params for angular
        if (this.tasks.contains(angularTasks.BUILD)) {
            angular.verifyBuildConfigs(this);
        }

        // Check params for FTP build deploy
        if (this.tasks.contains(angularTasks.DEPLOY_BUILD)) {
            angular.verifyBuildDir(this);
            remote.verifyUploadBuildsSteps(this);
        }

        // Check params for FTP build uploader on the repo
        if (this.tasks.contains(angularTasks.UPLOAD_REPO)) {
            angular.verifyBuildDir(this);
            remote.verifyRepoUpdate(this);
            angular.verifyUploadRepoConfigs(this);
        }

        // Check params for email sender
        if (this.tasks.contains(angularTasks.SEND_EMAIL)) {
            email.verify(this);
        }
    }

    /**
     * Verifies all cordova configuration and params
     */
    cordovaVerify() {
        // Check params for sources compiler steps
        if (this.tasks.contains(cordovaTasks.COMPILE_SOURCES)) {
            cordova.verifyCompileConfigs(this);
        }

        // Check params for change version task
        if (this.tasks.contains(cordovaTasks.CHANGE_VERSION)) {
            cordova.verifyVersionConfigs(this);
        }

        // Check params for iOS app builder
        if (this.tasks.contains(cordovaTasks.BUILD_IOS)) {
            cordova.verifyIos(this);
        }

        // Check params for Android app builder
        if (this.tasks.contains(cordovaTasks.BUILD_ANDROID)) {
            cordova.verifyAndroid(this);
        }

        // Check params for FTP build uploader
        if (this.tasks.contains(cordovaTasks.UPLOAD_BUILDS)) {
            remote.verifyUploadBuildsSteps(this);
        }

        // Check params for FTP sources uploader
        if (this.tasks.contains(cordovaTasks.UPLOAD_SOURCES)) {
            remote.verifyUploadSourcesStep(this);
        }

        // Check params for email sender
        if (this.tasks.contains(cordovaTasks.SEND_EMAIL)) {
            email.verify(this);
        }
    }

    printRecap() {
        const config = this;
        return new Promise(resolve => {
            asciimo.write('  ' + config.app.name, 'Ogre', art => {
                logger.info('\n#########################################################');
                logger.info(art);
                logger.info('#########################################################');
                logger.info('  App name:\t\t\t', config.app.name);
                logger.info('  App label:\t\t\t', config.app.label);
                logger.info('  App version:\t\t\t', config.app.version);
                logger.info('  App version label:\t\t', config.app.versionLabel);
                if (config.tasks.contains(cordovaTasks.BUILD_IOS)) {
                    logger.info('  iOS bundle id:\t\t', config.ios.bundleId);
                    logger.info('  iOS bundle version:\t\t', config.ios.bundleVersion);
                }
                if (config.tasks.contains(cordovaTasks.BUILD_ANDROID)) {
                    logger.info('  Android bundle id:\t\t', config.android.bundleId);
                    logger.info('  Android version code:\t\t', config.android.versionCode);
                }
                // if (config.tasks.contains(angularTasks.UPLOAD_REPO)) {
                //     logger.info('  Angular version :\t\t', config.app.version);
                //     logger.info('  Android version code:\t\t', config.android.versionCode);
                // }
                logger.info('  Change log:\t\t\t', config.changeLog[0]);
                for (let i = 1; i < config.changeLog.length; i++) {
                    logger.info('\t\t\t\t', config.changeLog[i]);
                }
                logger.info('#########################################################\n');

                const validateRecap = resolve => {
                    utils.prompt('Press \'y\' to continue the build process, \'n\' to stop it').then(
                        result => {
                            if (result.toLowerCase() === 'y') {
                                resolve();
                            }
                            else if (result.toLowerCase() === 'n') {
                                logger.info('\n\nExit process...\n\n');
                                process.exit(0);
                            }
                            else {
                                validateRecap(resolve);
                            }
                        },
                        err => {
                            logger.error(err);
                            process.exit(1);
                        }
                    );
                };
                if (config.force) {
                    resolve();
                }
                else {
                    validateRecap(resolve);
                }
            });
        });
    }
}

module.exports = new Config();
