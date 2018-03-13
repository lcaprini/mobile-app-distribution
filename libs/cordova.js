'use strict';

const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const CordovaConfig = require('cordova-config');
const inquirer = require('inquirer');
const logger = require('./logger');
const android = require('./android');
const ios = require('./ios');
const remote = require('./remote');
const email = require('./email');
const utils = require('./utils');

const TASKS = {
    CHANGE_VERSION  : 'v',
    COMPILE_SOURCES : 'c',
    BUILD_IOS       : 'i',
    BUILD_ANDROID   : 'a',
    UPLOAD_BUILDS   : 'u',
    UPLOAD_SOURCES  : 'z',
    SEND_EMAIL      : 'e'
};

const Cordova = {

    /**
     * Compile web app sources in cordova app using task manager like, grunt, gulp, webpack, ecc...
     */
    compileSource({sourcePath, compileSourcesCmd, verbose = false}) {
        process.chdir(sourcePath);
        logger.section(`Compile source:\n$ ${compileSourcesCmd}`);
        shell.exec(compileSourcesCmd, {silent : !verbose});
    },

    /**
     * Set app version in config.xml using cordova-config module
     */
    setVersion({cordovaPath, appVersion}) {
        logger.section(`Set '${appVersion}' as version in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setVersion(appVersion);
        config.writeSync();
    },

    /**
     * Set app label version in HTML
     */
    changeVersion({filePath, version}) {
        logger.section(`Set '${version}' as version in ${filePath} HTML`);
        let versionFile = fs.readFileSync(filePath, 'utf-8');
        try {
            let newVersionFile = versionFile.replace(/<mad-app-version.*>([\s\S]*?)<\/mad-app-version>/ig, `<mad-app-version> ${version} </mad-app-version>`);
            versionFile = newVersionFile;
            fs.writeFileSync(filePath, versionFile, 'utf-8');
        }
        catch (err) {
            logger.error(err);
        }
    },

    /**
     * Set bundle id in config.xml using cordova-config module
     */
    setId({cordovaPath, id}) {
        logger.section(`Set '${id}' as bundle id in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setID(id);
        config.writeSync();
    },

    /**
     * Set Android version code in config.xml using cordova-config module
     */
    setAndroidVersionCode({cordovaPath, versionCode}) {
        logger.section(`Set '${versionCode}' as Android version code in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setAndroidVersionCode(versionCode);
        config.writeSync();
    },

    /**
     * Build Android Cordova Platform
     */
    buildAndroid({buildAndroidCommand, cordovaPath, verbose}) {
        logger.section(`Build Android platform:\n$ ${buildAndroidCommand}`);
        process.chdir(cordovaPath);
        let err = shell.exec(buildAndroidCommand, {silent : !verbose}).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    },

    /**
     * Exec all task to prepare and build the Android platform
     */
    distributeAndroid({launcherName, id, versionCode, cordovaPath, buildAndroidCommand = 'cordova build --release android', apkFilePath, keystore, verbose = false}) {
        this.setId({cordovaPath, id});
        this.setAndroidVersionCode({cordovaPath, versionCode});
        let androidPlatformPath = path.join(cordovaPath, './platforms/android/');
        android.setLauncherName({rootPath : androidPlatformPath, launcherName});
        this.buildAndroid({buildAndroidCommand, cordovaPath, verbose});
        android.finalizeApk({projectPath : androidPlatformPath, keystore, apkFilePath, verbose});
    },

    /**
     * Set iOS version code in config.xml using cordova-config module
     */
    setIosBundleVersion({cordovaPath, bundleVersion}) {
        logger.section(`Set '${bundleVersion}' as iOS bundle version in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setIOSBundleVersion(bundleVersion);
        config.writeSync();
    },

    /**
     * Build iOS Cordova Platform
     */
    buildIos({buildIosCommand, cordovaPath, verbose}) {
        logger.section(`Build iOS platform:\n$ ${buildIosCommand}`);
        process.chdir(cordovaPath);
        let err = shell.exec(buildIosCommand, {silent : !verbose}).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    },

    /**
     * Exec all task to prepare and build the iOS platform
     */
    distributeIos({appName, displayName, ipaFileName, id, version, bundleVersion, schema, infoPlistPath, cordovaPath, buildIosCommand = 'cordova build ios', exportOptionsPlist, exportOptionsPlistPath, exportDir, ipaUrlPath, manifestPath, verbose = false}) {
        this.setId({cordovaPath, id});
        this.setIosBundleVersion({cordovaPath, bundleVersion});
        ios.setDisplayName({infoPlistPath, displayName});
        this.buildIos({buildIosCommand, cordovaPath, verbose});
        const projectPath = path.join(cordovaPath, './platforms/ios');
        ios.cleanProject({projectPath, verbose});
        ios.archiveProject({projectPath, appName, schema, verbose});
        ios.exportIpa({projectPath, appName, ipaFileName, exportOptionsPlist, exportOptionsPlistPath, exportDir, verbose});
        ios.createManifest({id, version, ipaUrlPath, manifestPath, appName, schema, exportDir});
    },

    /**
     * Compose email for
     */
    composeEmail({appName, appLabel, appVersion, changelog, releaseDate, repoHomepageUrl, androidBuildPath = null, iosBuildPath = null}) {
        let bodyEmail = fs.readFileSync(path.join(__dirname, '../resources/distribute-email.tmpl.html')).toString();

        bodyEmail = bodyEmail.replace(/___APP_LABEL___/g, appLabel);
        bodyEmail = bodyEmail.replace(/___APP_NAME___/g, appName);
        bodyEmail = bodyEmail.replace(/___APP_VERSION___/g, appVersion);

        let htmlChangelog = '';
        for (let i = 0; i < changelog.length; i++) {
            htmlChangelog += `✓ ${changelog[i]} <br/>`;
        }

        bodyEmail = bodyEmail.replace(/___CHANGELOG___/g, htmlChangelog);
        bodyEmail = bodyEmail.replace(/___RELEASE_DATE___/g, releaseDate);
        bodyEmail = bodyEmail.replace(/___REPO_HOMEPAGE_URL___/g, repoHomepageUrl);

        const androidDirectDownload = androidBuildPath;
        const iosDirectDownload = (iosBuildPath) ? 'itms-services://?action=download-manifest&url=' + iosBuildPath : null;

        if (androidDirectDownload) {
            bodyEmail = bodyEmail.replace(/___ANDROID_DIRECT_DOWNLOAD_URL___/g, androidDirectDownload);
            bodyEmail = bodyEmail.replace(/___ANDROID_DOWNLOAD_NOT_AVAILABLE___/g, '');
        }
        else {
            bodyEmail = bodyEmail.replace(/___ANDROID_DOWNLOAD_NOT_AVAILABLE___/g, 'hidden');
        }
        if (iosDirectDownload) {
            bodyEmail = bodyEmail.replace(/___IOS_DIRECT_DOWNLOAD_URL___/g, iosDirectDownload);
            bodyEmail = bodyEmail.replace(/___IOS_DOWNLOAD_NOT_AVAILABLE___/g, '');
        }
        else {
            bodyEmail = bodyEmail.replace(/___IOS_DOWNLOAD_NOT_AVAILABLE___/g, 'hidden');
        }

        return bodyEmail;
    },

    /**
     * Verify configuration for compile and config update steps
     * @param {Object} config
     */
    verifyCompileConfigs(config) {
        if (!config.sources.compileCommand) {
            throw new Error('Source compile error: missing "sources.compileCommand" value in config file');
        }
        if (!fs.existsSync(config.sources.compilePath)) {
            throw new Error(`Source compile error: directory "sources.compilePath" doesn't exists at ${config.sources.compilePath}`);
        }
        if (!fs.existsSync(config.cordova.path)) {
            throw new Error(`Source compile error: directory "cordova.rootPath" doesn't exists at ${config.cordova.path}`);
        }
        if (!fs.existsSync(config.cordova.configPath)) {
            throw new Error(`Source compile error: config.xml file doesn't exists in ${config.cordova.path}`);
        }
        if (!config.app.version) {
            throw new Error('Invalid build version format: please, see http://semver.org');
        }
    },

    /**
     * Verify configuration for change version steps
     * @param {Object} config
     */
    verifyVersionConfigs(config) {
        if (!config.sources.htmlVersionPath) {
            throw new Error('Version change error: missing "sources.htmlVersionPath" value in config file');
        }
        if (!fs.existsSync(config.sources.htmlVersionPath)) {
            throw new Error(`Version change error: file "sources.htmlVersionPath" doesn't exists at ${config.htmlVersionPath}`);
        }
    },

    /**
     * Verify configuration for build Android APK
     * @param {Object} config
     */
    verifyAndroid(config) {
        android.verify(config);
    },

    /**
     * Verify configuration for build iOS IPA
     * @param {Object} config
     */
    verifyIos(config) {
        ios.verify(config);
    },

    /**
     * Inizialize configuration for web app source compile
     */
    initializeSourceCompile(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'compileCommand',
            message : 'sources.compileCommand',
            default : 'grunt build:production'
        }, {
            type    : 'input',
            name    : 'compilePath',
            message : 'sources.compilePath',
            default : 'src'
        }]).then(({compileCommand, compilePath}) => {
            if (!config.sources) {
                config.sources = {};
            }
            config.sources.compileCommand = compileCommand;
            config.sources.compilePath = compilePath;
            return config;
        });
    },

    /**
     * Inizialize configuration for change version task
     */
    initializeChangeVersion(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'htmlVersionPath',
            message : 'sources.htmlVersionPath',
            default : 'src/html/partials/login.html'
        }]).then(({htmlVersionPath}) => {
            if (!config.sources) {
                config.sources = {};
            }
            config.sources.htmlVersionPath = htmlVersionPath;
            return config;
        });
    },

    /**
     * Inizialize general configuration for Cordova build
     */
    initializeGeneral(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'rootPath',
            message : 'cordova.rootPath',
            default : 'app'
        }, {
            type    : 'input',
            name    : 'buildsDir',
            message : 'buildsDir',
            default : 'builds/'
        }]).then(({rootPath, buildsDir}) => {
            if (!config.cordova) {
                config.cordova = {};
            }
            config.cordova.rootPath = rootPath;
            config.buildsDir = buildsDir;
            return config;
        });
    },

    /**
     * Inizialize ditribute.json for Cordova project
     * @param {*} config
     */
    init(config) {
        let cordova = this;

        const TASKS = {
            CHANGE_VERSION  : 'Change app version in HTML',
            COMPILE_SOURCES : 'Compile web app sources',
            BUILD_IOS       : 'Build Cordova iOS platform',
            BUILD_ANDROID   : 'Build Cordova Android platform',
            UPLOAD_BUILDS   : 'Upload builds',
            UPLOAD_SOURCES  : 'Upload sources',
            SEND_EMAIL      : 'Send email to working group'
        };

        return inquirer.prompt([{
            type    : 'checkbox',
            message : 'Which tasks you want configure?',
            name    : 'tasks',
            choices : [
                { name : TASKS.CHANGE_VERSION },
                { name : TASKS.COMPILE_SOURCES },
                { name : TASKS.BUILD_IOS },
                { name : TASKS.BUILD_ANDROID },
                { name : TASKS.UPLOAD_BUILDS },
                { name : TASKS.UPLOAD_SOURCES },
                { name : TASKS.SEND_EMAIL }
            ]}]).then(({tasks}) => {
                let questions = [];

                if (tasks.contains(TASKS.COMPILE_SOURCES)) {
                    questions.push(cordova.initializeSourceCompile);
                }

                if (tasks.contains(TASKS.CHANGE_VERSION)) {
                    questions.push(cordova.initializeChangeVersion);
                }

                questions.push(cordova.initializeGeneral);

                if (tasks.contains(TASKS.BUILD_IOS)) {
                    questions.push(ios.initializeBuild);
                }

                if (tasks.contains(TASKS.BUILD_ANDROID)) {
                    questions.push(android.initializeBuild);
                }

                if (tasks.contains(TASKS.UPLOAD_BUILDS)) {
                    questions.push(remote.initializeBuildUpload);

                    if (tasks.contains(TASKS.BUILD_IOS)) {
                        questions.push(remote.initializeIosBuildUpload);
                    }

                    if (tasks.contains(TASKS.BUILD_ANDROID)) {
                        questions.push(remote.initializeAndroidBuildUpload);
                    }

                    questions.push(remote.initializeRepoUpdate);

                    if (tasks.contains(TASKS.BUILD_IOS)) {
                        questions.push(remote.initializeIosRepoUpdate);
                    }

                    if (tasks.contains(TASKS.BUILD_ANDROID)) {
                        questions.push(remote.initializeAndroidRepoUpdate);
                    }
                }

                if (tasks.contains(TASKS.UPLOAD_SOURCES)) {
                    questions.push(remote.initializeSourcesUpload);
                }

                if (tasks.contains(TASKS.SEND_EMAIL)) {
                    questions.push(email.initializeSend);
                }

                return utils.askQuestions(questions, config).then(
                    config => {
                        return config;
                    },
                    err => {
                        logger.error(err);
                        process.exit(1);
                    });
            });
    }
};

module.exports = {
    CORDOVA : Cordova,
    TASKS   : TASKS
};
