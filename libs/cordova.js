'use strict';

const shell = require('shelljs');
const fs = require('fs');
const et = require('elementtree');
const path = require('path');
const Config = require('cordova-config');
const logger = require('./logger');
const utils = require('./utils');
const android = require('./android');
const ios = require('./ios');

const TASKS = {
    CHANGE_VERSION : 'v',
    COMPILE_SOURCES : 'c',
    BUILD_IOS : 'i',
    BUILD_ANDROID : 'a',
    UPLOAD_BUILDS : 'f',
    UPDATE_REPO : 'j',
    UPLOAD_SOURCES : 'z',
    SEND_EMAIL : 'e'
}

class Cordova {

    /**
     * Compile web app sources in cordova app using task manager like, grunt, gulp, webpack, ecc...
     */
    compileSource({sourcePath, compileSourcesCmd, verbose = false}){
        process.chdir(sourcePath);
        logger.section(`Compile source:\n$ ${compileSourcesCmd}`);
        shell.exec(compileSourcesCmd, {silent: !verbose});
    }

    /**
     * Set app version in config.xml using cordova-config module
     */
    setVersion({cordovaPath, appVersion}){
        logger.section(`Set version in config.xml to ${appVersion}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setVersion(appVersion);
        config.writeSync();
    }

    /**
     * Set bundle id in config.xml using cordova-config module
     */
    setId({cordovaPath, id}){
        logger.section(`Set id in config.xml to ${id}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setID(id);
        config.writeSync();
    }

    /**
     * Set Android version code in config.xml using cordova-config module
     */
    setAndroidVersionCode({cordovaPath, versionCode}){
        logger.section(`Set Android version code in config.xml to ${versionCode}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setAndroidVersionCode(versionCode);
        config.writeSync();
    }

    /**
     * Set Android app launcher name in strings.xml file using elementtre module
     */
    setLauncherName({cordovaPath, launcherName}){
        logger.section(`Set Android launcher name in strings.xml to ${launcherName}`);
        try{
            const cordovaAndroidStringsPath = path.join(cordovaPath, './platforms/android/res/values/strings.xml');
            let strings = fs.readFileSync(cordovaAndroidStringsPath, 'utf-8');
            let stringsTree = new et.ElementTree(et.XML(strings));
            let launcherNameElement = stringsTree.findall('./string/[@name="launcher_name"]')[0];
            launcherNameElement.text = launcherName;
            fs.writeFileSync(cordovaAndroidStringsPath, stringsTree.write({indent: 4}), 'utf-8');
        }
        catch(err){
            logger.error(err);
        }
    }

    /**
     * Build Android Cordova Platform
     */
    buildAndroid({cmdCordovaAndroid, cordovaPath, verbose}){
        logger.section(`Build Android platform:\n$ ${cmdCordovaAndroid}`);
        process.chdir(cordovaPath);
        let err = shell.exec(cmdCordovaAndroid, {silent: !verbose}).stderr;
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
     * Exec all task to prepare and build the Android platform
     */
    distributeAndroid({launcherName, id, versionCode, cmdCordovaAndroid = 'cordova build --release android', cordovaPath, apkFilePath, keystore, verbose = false}){
        this.setId({cordovaPath, id});
        this.setAndroidVersionCode({cordovaPath, versionCode});
        this.setLauncherName({cordovaPath, launcherName})
        this.buildAndroid({cmdCordovaAndroid, cordovaPath, verbose});
        const androidProjectPath = path.join(cordovaPath, './platforms/android');
        android.signAPK({androidProjectPath, keystore, verbose});
        android.alignAPK({androidProjectPath, apkFilePath, verbose});
    }

    verifyConfigs(config){
        if(!config.compileSourcesCmd){
            throw new Error('Source compile error: missing "compile-sources-cmd" value in config file');
        }
        if(!fs.existsSync(config.sourcePath)){
            throw new Error(`Source compile error: directory "compile-sources-path" doesn\'t exists at ${config.sourcePath}`);
        }
        if(!fs.existsSync(config.cordovaPath)){
            throw new Error(`Source compile error: directory "cordova-root-path" doesn\'t exists at ${config.cordovaPath}`);
        }
        if(!fs.existsSync(config.cordovaConfigPath)){
            throw new Error(`Source compile error: config.xml file doesn\'t exists in ${config.cordovaPath}`);
        }
        if(!config.appVersion){
            throw new Error('Invalid build version format: please, see http://semver.org');
        }
    }
}

module.exports = {
    cordova : new Cordova(),
    TASKS : TASKS
}