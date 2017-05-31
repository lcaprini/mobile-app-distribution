'use strict';

const shell = require('shelljs');
const fs = require('fs');
const et = require('elementtree');
const path = require('path');
const Config = require('cordova-config');
const logger = require('./logger');
const utils = require('./utils');

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
     * Set app version in config.xml
     */
    setVersion({cordovaConfigPath, appVersion}){
        logger.section('Set version in config.xml');
        const config = new Config(cordovaConfigPath);
        config.setVersion(appVersion);
        config.writeSync();
    }

    /**
     * Set bundle id in config.xml
     */
    setId({cordovaConfigPath, id}){
        logger.section('Set id in config.xml');
        const config = new Config(cordovaConfigPath);
        config.setID(id);
        config.writeSync();
    }

    /**
     * Set Android version code in config.xml
     */
    setAndroidVersionCode({cordovaConfigPath, versionCode}){
        logger.section('Set Android version code in config.xml');
        const config = new Config(cordovaConfigPath);
        config.setAndroidVersionCode(versionCode);
        config.writeSync();
    }

    /**
     * Set Android app launcher name in strings.xml file 
     */
    setLauncherName({cordovaAndroidStringsPath, launcherName}){
        logger.section('Set Android launcher name in strings.xml');
        try{
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
     * Exec all task to prepare and build the Android platform
     */
    buildAndroid({cordovaConfigPath, id, versionCode, launcherName, cordovaAndroidStringsPath}){
        this.setId({cordovaConfigPath, id});
        this.setAndroidVersionCode({cordovaConfigPath, versionCode});
        this.setLauncherName({cordovaAndroidStringsPath, launcherName})
    }

    // build() {
    //     const config = require('./config');
        
    //     let v1 = shell.exec('node --version', {silent:true}).stdout;
    //     logger.debug(v1);
    //     let err = shell.exec('noaasdde --version', {silent:true}).stderr;
    //     logger.debug(err);
    //     if(shell.error()){
    //         logger.debug(shell.error());
    //     }
    //     process.chdir(config.rootPath)
    //     console.log('New directory: ' + process.cwd());
    //     // shell.exec('npm install', function(code, stdout, stderr) {
    //     //     console.log('Exit code:', code);
    //     //     console.log('Program output:', stdout);
    //     //     console.log('Program stderr:', stderr);
    //     // });

    //     var child = shell.exec('npasdm inita', {async:true, silent:true});
    //     child.stdout.on('data', function(data) {
    //         console.log(data);
    //     });
    //     child.stderr.on('data', function(data){
    //         console.log('err', data);
    //     });
    //     child.stdout.on('end', function(data) {
    //         console.log('end--', data);
    //     });
    //     child.stderr.on('end', function(data){
    //         console.log('end--', 'err', data);
    //     });
    // }
}

module.exports = {
    cordova : new Cordova(),
    TASKS : TASKS
}