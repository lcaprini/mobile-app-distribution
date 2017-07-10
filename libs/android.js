'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const commandExists = require('command-exists').sync;

const logger = require('./logger');
const utils = require('./utils');

class Android {

    /**
     * Calculate version code from app version
     * @param {String} appVersion - Versione string in simver syntax
     */
    calculateVersionCode(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return parseInt(versions[2]) + (parseInt(versions[1]) * 100) + (parseInt(versions[0]) * 10000);
    }

    /**
     * Sign APK with keystore
     * @param {Object} param0 
     * @param {String} param0.androidProjectPath - Root path of Android project
     * @param {Object} param0.keystore - Keystore info
     * @param {String} param0.keystore.path - Keystore path
     * @param {String} param0.keystore.alias - Keystore alias
     * @param {String} param0.keystore.password - Keystore alias' password
     * @param {String} param0.appName - Label of release APK created after build process
     * @param {Boolean} param0.verbose - The logger prints every process message only if it's true
     */
    signAPK({androidProjectPath, keystore : {path : keystorePath, alias : keystoreAlias, password : keystorePassword}, appName = 'android', verbose}){
        const buildApkPath = path.join(androidProjectPath, './build/outputs/apk');
        process.chdir(buildApkPath);
        const cmdAndroidSignAPK = `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore '${keystorePath}' -storepass '${keystorePassword}' '${appName}-release-unsigned.apk' '${keystoreAlias}'`
        let err = shell.exec(cmdAndroidSignAPK, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    }

    /**
     * Align signed APK 
     * @param {Object} param0 
     * @param {String} param0.androidProjectPath - Root path of Android project
     * @param {String} param0.appName - Label of release APK created and signed
     * @param {String} param0.apkFilePath - Destination path of aligned APK
     * @param {Boolean} param0.verbose - The logger prints every process message only if it's true
     */
    alignAPK({androidProjectPath, appName = 'android', apkFilePath, verbose}){
        const buildApkPath = path.join(androidProjectPath, './build/outputs/apk');
        process.chdir(buildApkPath);
        const cmdAndroidAlignAPK = `zipalign -vf 4 '${appName}-release-unsigned.apk' '${apkFilePath}'`;
        let err = shell.exec(cmdAndroidAlignAPK, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    }

    uploadAPK({apkFilePath, server, destinationPath}){
        logger.section(`Upload Android apk on ${destinationPath}`);
        const remoteFile = path.join(destinationPath, path.basename(apkFilePath));
        return utils.uploadFile({
            localFile : apkFilePath,
            server : server,
            remoteFile : remoteFile
        });
    }

    verify(config){
        if(!config.android.bundleId){
            throw new Error('Android build error: missing "android.bundleId" value in config file');
        }
        const androidProjectPath = path.join(config.cordova.path, './platforms/android');
        if(!fs.existsSync(androidProjectPath)){
            throw new Error(`Android build error: no Android project in "${androidProjectPath}" directory`);
        }
        if(!fs.existsSync(config.android.keystore.path)){
            throw new Error(`Android build error: missing file "${config.android.keystore.path}"`);
        }
        if(!config.android.keystore.alias){
            throw new Error('Android build error: missing "android.keystore.alias" value in config file');
        }
        if(!config.android.keystore.password){
            throw new Error('Android build error: missing "android.keystore.password" value in config file');
        }
        if(!fs.existsSync(config.buildsDir)){
            utils.createPath({workingPath: config.rootPath, path: config.buildsDir});
        }
        if(!commandExists('jarsigner')){
            throw new Error('Android build error: command "jarsigner" not found, please add Android SDK tools in $PATH');
        }
        if(!commandExists('zipalign')){
            throw new Error('Android build error: command "zipalign" not found, please add last Android SDK build-tools in $PATH');
        }
    }
}

module.exports = new Android();