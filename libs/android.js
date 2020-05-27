'use strict';

const fs = require('fs');
const et = require('elementtree');
const path = require('path');
const shell = require('shelljs');
const commandExists = require('command-exists').sync;
const inquirer = require('inquirer');

const logger = require('./logger');
const utils = require('./utils');
const remote = require('./remote');

class Android {
    /**
     * Calculate version code from app version
     * @param {String} appVersion - Versione string in simver syntax
     */
    calculateVersionCode(appVersion) {
        let versions = appVersion.split('.');

        return parseInt(versions[2]) + (parseInt(versions[1]) * 100) + (parseInt(versions[0]) * 10000);
    }

    /**
     * Get the right strings.xml path in project
     */
    getStringsPath({rootPath}) {
        let stringsPath = null;
        // Test for last project structure
        stringsPath = path.join(rootPath, './app/src/main/res/values/strings.xml');
        if (!fs.existsSync(stringsPath)) {
            // Test for previuos folder structure
            stringsPath = path.join(rootPath, './res/values/strings.xml');
        }

        return stringsPath;
    }

    /**
     * Set app launcher name in strings.xml file using ElementTree module
     */
    setLauncherName({rootPath, launcherName}) {
        logger.section(`Set '${launcherName}' as Android launcher name in strings.xml`);
        try {
            const androidStringsPath = this.getStringsPath({rootPath});
            let strings = fs.readFileSync(androidStringsPath, 'utf-8');
            let stringsTree = new et.ElementTree(et.XML(strings));
            let launcherNameElement = stringsTree.findall('./string/[@name="launcher_name"]')[0];
            launcherNameElement.text = launcherName;
            fs.writeFileSync(androidStringsPath, stringsTree.write({indent: 4}), 'utf-8');
        }
        catch (err) {
            logger.error(err);
        }
    }

    /**
     * Get the right apk release folder path in project
     */
    getReleasePath({projectPath}) {
        // Test for last project structure
        let releasePath = path.join(projectPath, './app/build/outputs/apk/release');
        if (fs.existsSync(releasePath)) {
            return releasePath;
        }
        // Test for previuoses folders structure
        releasePath = path.join(projectPath, './build/outputs/apk/release');
        if (fs.existsSync(releasePath)) {
            return releasePath;
        }
        releasePath = path.join(projectPath, './build/outputs/apk');
        if (fs.existsSync(releasePath)) {
            return releasePath;
        }
        return null;
    }

    /**
     * Get the right apk release file path in project
     */
    getReleaseApkPath({releaseFolderPath}) {
        // Test for last project structure (module name 'app')
        let moduleName = 'app';
        let apkReleasePath = path.join(releaseFolderPath, `./${moduleName}-release-unsigned.apk`);
        if (fs.existsSync(apkReleasePath)) {
            return apkReleasePath;
        }
        // Test for previuos folder structure (module name 'android')
        moduleName = 'android';
        apkReleasePath = path.join(releaseFolderPath, `./${moduleName}-release-unsigned.apk`);
        if (fs.existsSync(apkReleasePath)) {
            return apkReleasePath;
        }
        return null;
    }

    /**
     * Sign APK with keystore
     * @param {Object} param0
     * @param {String} param0.apkReleasePath - Path of unsigned release apk file
     * @param {Object} param0.keystore - Keystore info
     * @param {String} param0.keystore.path - Keystore path
     * @param {String} param0.keystore.alias - Keystore alias
     * @param {String} param0.keystore.password - Keystore alias' password
     * @param {Boolean} param0.verbose - The logger prints every process message only if it's true
     */
    signAPK({apkReleasePath, keystore: {path: keystorePath, alias: keystoreAlias, password: keystorePassword}, verbose}) {
        logger.section('Sign Android apk with jarsigner command');
        const cmdAndroidSignAPK = `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore '${keystorePath}' -storepass '${keystorePassword}' '${apkReleasePath}' '${keystoreAlias}'`;
        let err = shell.exec(cmdAndroidSignAPK, {silent: !verbose}).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    }

    /**
     * Align signed APK
     * @param {Object} param0
     * @param {String} param0.apkReleasePath - Path of signed release apk file
     * @param {String} param0.apkFilePath - Destination path of aligned APK
     * @param {Boolean} param0.verbose - The logger prints every process message only if it's true
     */
    alignAPK({apkReleasePath, apkFilePath, verbose}) {
        logger.section('Align signed Android apk with zipalign command');
        const cmdAndroidAlignAPK = `zipalign -vf 4 '${apkReleasePath}' '${apkFilePath}'`;
        let err = shell.exec(cmdAndroidAlignAPK, {silent: !verbose}).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    }

    /**
     * Sign and align APK
     * @param {Object} param0
     * @param {String} param0.projectPath - Root path of Android project
     * @param {Object} param0.keystore - Keystore info
     * @param {String} param0.apkFilePath - Destination path of aligned APK
     * @param {Boolean} param0.verbose - The logger prints every process message only if it's true
     */
    finalizeApk({projectPath, keystore, apkFilePath, verbose}) {
        const releaseFolderPath = this.getReleasePath({projectPath});
        if (!releaseFolderPath) {
            logger.error('No apk release folder exists');
            process.exit(1);
        }
        const apkReleasePath = this.getReleaseApkPath({releaseFolderPath});
        if (!apkReleasePath) {
            logger.error('No apk release file exists');
            process.exit(1);
        }
        this.signAPK({apkReleasePath, keystore, verbose});
        this.alignAPK({apkReleasePath, apkFilePath, verbose});
    }

    uploadAPK({apkFilePath, server, destinationPath}) {
        logger.section(`Upload Android apk on ${destinationPath}`);
        const remoteFile = path.join(destinationPath, path.basename(apkFilePath));
        return remote.uploadFile({
            localFile: apkFilePath,
            server: server,
            remoteFile: remoteFile
        });
    }

    verify(config) {
        if (!config.android.bundleId) {
            throw new Error('Android build error: missing "android.bundleId" value in config file');
        }
        const projectPath = path.join(config.cordova.path, './platforms/android');
        if (!fs.existsSync(projectPath)) {
            throw new Error(`Android build error: no Android project in "${projectPath}" directory`);
        }
        const stringsPath = this.getStringsPath({rootPath: projectPath});
        if (!stringsPath) {
            throw new Error('Android build error: strings.xml file does not exists');
        }
        if (!fs.existsSync(config.android.keystore.path)) {
            throw new Error(`Android build error: missing file "${config.android.keystore.path}"`);
        }
        if (!config.android.keystore.alias) {
            throw new Error('Android build error: missing "android.keystore.alias" value in config file');
        }
        if (!config.android.keystore.password) {
            throw new Error('Android build error: missing "android.keystore.password" value in config file');
        }
        if (!fs.existsSync(config.buildsDir)) {
            utils.createPath({workingPath: config.rootPath, path: config.buildsDir});
        }
        if (!commandExists('jarsigner')) {
            throw new Error('Android build error: command "jarsigner" not found, please add Android SDK tools in $PATH');
        }
        if (!commandExists('zipalign')) {
            throw new Error('Android build error: command "zipalign" not found, please add last Android SDK build-tools in $PATH');
        }
    }

    initializeBuild(config) {
        return inquirer.prompt([{
            type: 'input',
            name: 'bundleId',
            message: 'android.bundleId',
            default: 'it.lcaprini.test',
            validate(input) {
                const pattern = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i;
                return pattern.test(input);
            }
        }, {
            type: 'input',
            name: 'path',
            message: 'android.keystore.path',
            default: 'resources/android/lcaprini.keystore'
        }, {
            type: 'input',
            name: 'alias',
            message: 'android.keystore.alias',
            default: 'lcaprini-alias'
        }, {
            type: 'input',
            name: 'password',
            message: 'android.keystore.password',
            default: 'lcaprini-password'
        }]).then(({bundleId, path, alias, password}) => {
            if (!config.android) {
                config.android = {};
            }
            config.android.bundleId = bundleId;
            config.android.keystore = {
                path: path,
                alias: alias,
                password: password
            };
            return config;
        });
    }
}

module.exports = new Android();
