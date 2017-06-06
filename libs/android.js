'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const commandExists = require('command-exists').sync;

const logger = require('./logger');

// jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore {} -storepass {} {}-release-unsigned.apk {}
// zipalign -vf 4 {}-release-unsigned.apk {}

class Android {

    calculateVersionCode(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return parseInt(versions[2]) + (parseInt(versions[1]) * 100) + (parseInt(versions[0]) * 10000);
    }

    signAPK({androidProjectPath, keystore : {path : keystorePath, alias : keystoreAlias, password : keystorePassword}, appName = 'android', verbose}){
        const buildApkPath = path.join(androidProjectPath, './build/outputs/apk');
        process.chdir(buildApkPath);
        const cmdAndroidSignAPK = `jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ${keystorePath} -storepass ${keystorePassword} ${appName}-release-unsigned.apk ${keystoreAlias}`
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

    alignAPK(){

    }

    verifyConfigs(config){
        if(!config.androidBundleId){
            throw new Error('Android build error: missing "android-bundle-id" value in config file');
        }
        if(!fs.existsSync(config.androidProjectPath)){
            throw new Error(`Android build error: no Android project in "${config.androidProjectPath}" directory`);
        }
        if(!fs.existsSync(config.androidKeystorePath)){
            throw new Error(`Android build error: missing file "${config.androidKeystorePath}"`);
        }
        if(!config.androidKeystoreAlias){
            throw new Error('Android build error: missing "android-keystore-alias" value in config file');
        }
        if(!config.androidKeystorePassword){
            throw new Error('Android build error: missing "android-keystore-password" value in config file');
        }
        // if(!config.androidApkUrlPath){
        //     throw new Error('Android build error: missing "android-apk-url-path" value in config file');
        // }
        if(!config.buildsDir){
            throw new Error('Android build error: missing "builds-dir" value in config file');
        }
        // if(!commandExists('jarsigner')){
        //     throw new Error('Android build error: command "jarsigner" not found, please add Android SDK tools in $PATH');
        // }
        // if(!commandExists('zipalign')){
        //     throw new Error('Android build error: command "zipalign" not found, please add last Android SDK build-tools in $PATH');
        // }
    }
}

module.exports = new Android();