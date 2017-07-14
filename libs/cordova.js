'use strict';

const shell = require('shelljs');
const fs = require('fs');
const et = require('elementtree');
const path = require('path');
const CordovaConfig = require('cordova-config');
const inquirer = require("inquirer");
const logger = require('./logger');
const utils = require('./utils');
const android = require('./android');
const ios = require('./ios');

const TASKS = {
    CHANGE_VERSION : 'v',
    COMPILE_SOURCES : 'c',
    BUILD_IOS : 'i',
    BUILD_ANDROID : 'a',
    UPLOAD_BUILDS : 'u',
    UPLOAD_SOURCES : 'z',
    SEND_EMAIL : 'e'
}

const Cordova = {

    /**
     * Compile web app sources in cordova app using task manager like, grunt, gulp, webpack, ecc...
     */
    compileSource({sourcePath, compileSourcesCmd, verbose = false}){
        process.chdir(sourcePath);
        logger.section(`Compile source:\n$ ${compileSourcesCmd}`);
        shell.exec(compileSourcesCmd, {silent: !verbose});
    },

    /**
     * Set app version in config.xml using cordova-config module
     */
    setVersion({cordovaPath, appVersion}){
        logger.section(`Set '${appVersion}' as version in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setVersion(appVersion);
        config.writeSync();
    },

    /**
     * Set app label version in HTML
     */
    changeVersion({filePath, version}){
        logger.section(`Set '${version}' as version in ${filePath} HTML`);
        let versionFile = fs.readFileSync(filePath, 'utf-8');
        try{
            let newVersionFile = versionFile.replace(/<mad-app-version.*>([\s\S]*?)<\/mad-app-version>/ig, `<mad-app-version> ${version} </mad-app-version>`);
            versionFile = newVersionFile;
            fs.writeFileSync(filePath, versionFile, 'utf-8');
        }catch(err){
            logger.error(err);
        }
    },

    /**
     * Set bundle id in config.xml using cordova-config module
     */
    setId({cordovaPath, id}){
        logger.section(`Set '${id}' as bundle id in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setID(id);
        config.writeSync();
    },

    /**
     * Set Android version code in config.xml using cordova-config module
     */
    setAndroidVersionCode({cordovaPath, versionCode}){
        logger.section(`Set '${versionCode}' as Android version code in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setAndroidVersionCode(versionCode);
        config.writeSync();
    },

    /**
     * Set Android app launcher name in strings.xml file using elementtre module
     */
    setLauncherName({cordovaPath, launcherName}){
        logger.section(`Set '${launcherName}' as Android launcher name in strings.xml`);
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
    },

    /**
     * Build Android Cordova Platform
     */
    buildAndroid({buildAndroidCommand, cordovaPath, verbose}){
        logger.section(`Build Android platform:\n$ ${buildAndroidCommand}`);
        process.chdir(cordovaPath);
        let err = shell.exec(buildAndroidCommand, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    },

    /**
     * Exec all task to prepare and build the Android platform
     */
    distributeAndroid({launcherName, id, versionCode, cordovaPath, buildAndroidCommand = 'cordova build --release android', apkFilePath, keystore, verbose = false}){
        this.setId({cordovaPath, id});
        this.setAndroidVersionCode({cordovaPath, versionCode});
        this.setLauncherName({cordovaPath, launcherName})
        this.buildAndroid({buildAndroidCommand, cordovaPath, verbose});
        const androidProjectPath = path.join(cordovaPath, './platforms/android');
        android.signAPK({androidProjectPath, keystore, verbose});
        android.alignAPK({androidProjectPath, apkFilePath, verbose});
    },

    /**
     * Set iOS version code in config.xml using cordova-config module
     */
    setIosBundleVersion({cordovaPath, bundleVersion}){
        logger.section(`Set '${bundleVersion}' as iOS bundle version in config.xml`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new CordovaConfig(cordovaConfigPath);
        config.setIOSBundleVersion(bundleVersion);
        config.writeSync();
    },

    /**
     * Build iOS Cordova Platform
     */
    buildIos({buildIosCommand, cordovaPath, verbose}){
        logger.section(`Build iOS platform:\n$ ${buildIosCommand}`);
        process.chdir(cordovaPath);
        let err = shell.exec(buildIosCommand, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    },

    /**
     * Exec all task to prepare and build the iOS platform
     */
    distributeIos({appName, displayName, ipaFileName, id, version, bundleVersion, schema, infoPlistPath, cordovaPath, buildIosCommand = 'cordova build ios', exportOptionsPlist, exportOptionsPlistPath, exportDir, ipaUrlPath, manifestPath, verbose = false}){
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
    composeEmail({appName, appLabel, appVersion, repoHomepageUrl, androidBuildPath = null, iosBuildPath = null}){
        let bodyEmail = `
        <!DOCTYPE html>
            <head>
            <meta charset="utf-8">
            <title>${appLabel}</title>
            <meta name="viewport" content="width=500">
                <style type="text/css" media="screen">
                    body {
                        font-family: Helvetica;
                    }
                    .center{
                        text-align: center;
                    }
                    div#main {
                        font-size: 1em;
                    }
                    .emph {
                        font-weight: bold;
                        font-size: large;
                    }
                    div#main table {
                        width: 90%;
                  		border: none;
                        margin: 0 auto;
                    }
                    div#main table td,
                    div#main table th {
                        border: none;
                    }
                    .qrcode-container {
                        width: 400px;
                        margin: 0 auto;
                    }
                    .qrcode {
                        width: 200px;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <header> <h1 class="center"> ${appName} </h1> </header>
                <div id="main">
                    <p>The version <span class="emph">${appVersion}</span> of <span class="emph">${appName}</span> app is now available</p>
                    <p>Please scan the following QRCode, ora click the following link; if it does not work please copy it and paste it into your browser</p>
                    <p class="center"><a href="${repoHomepageUrl}">${repoHomepageUrl}</a></p>
                    <div  class="center qrcode-container">
                        <a href="${repoHomepageUrl}"><img class="qrcode" src="https://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H|0&chl=${repoHomepageUrl}"/></a>
                    </div>
                    <br/>
                    <p>You can also directly download the app by scanning the following QRCodes or tapping on it</p>
                    <table>
                        <tr>
        `
        
        const androidDirectDownload = androidBuildPath;
        const iosDirectDownload = (iosBuildPath)? 'itms-services://?action=download-manifest&amp;url=' + iosBuildPath : null;
        
        if(androidDirectDownload){
            bodyEmail += '<th class="emph"> Android </th>'
        }
        if(iosDirectDownload){
            bodyEmail += '<th class="emph"> iOS </th>'
        }
        bodyEmail += '</tr>'

        bodyEmail += '<tr>'
        if(androidDirectDownload){
            bodyEmail += `
                <td class="center qrcode-container">
                    <a href="${androidDirectDownload}"><img class="qrcode" src="https://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H|0&chl=${androidDirectDownload}"/></a>
                </td>
            `
        }
        if(iosDirectDownload){
            bodyEmail += `
                <td class="center qrcode-container">
                    <a href="${iosDirectDownload}"><img class="qrcode" src="https://chart.googleapis.com/chart?cht=qr&chs=300x300&choe=UTF-8&chld=H|0&chl=${iosDirectDownload}"/></a>
                </td>
            `
        }
        bodyEmail += `  </tr>
                    </table>
                </div>
            </body>
        </html>
        `
        
        return bodyEmail;
    },

    /**
     * Verify configuration for compile and config update steps
     * @param {Object} config 
     */
    verifyCompileConfigs(config){
        if(!config.sources.compileCommand){
            throw new Error('Source compile error: missing "sources.compileCommand" value in config file');
        }
        if(!fs.existsSync(config.sources.compilePath)){
            throw new Error(`Source compile error: directory "sources.compilePath" doesn\'t exists at ${config.sources.compilePath}`);
        }
        if(!fs.existsSync(config.cordova.path)){
            throw new Error(`Source compile error: directory "cordova.rootPath" doesn\'t exists at ${config.cordova.path}`);
        }
        if(!fs.existsSync(config.cordova.configPath)){
            throw new Error(`Source compile error: config.xml file doesn\'t exists in ${config.cordova.path}`);
        }
        if(!config.app.version){
            throw new Error('Invalid build version format: please, see http://semver.org');
        }
    },

    /**
     * Verify configuration for change version steps
     * @param {Object} config 
     */
    verifyVersionConfigs(config){
        if(!config.sources.htmlVersionPath){
            throw new Error('Version change error: missing "sources.htmlVersionPath" value in config file');
        }
        if(!fs.existsSync(config.sources.htmlVersionPath)){
            throw new Error(`Version change error: file "sources.htmlVersionPath" doesn\'t exists at ${config.htmlVersionPath}`);
        }
    },

    /**
     * Verify configuration for build Android APK
     * @param {Object} config 
     */
    verifyAndroid(config){
        const cordovaAndroidStringsPath = path.join(config.cordova.path, './platforms/android/res/values/strings.xml');
        if(!fs.existsSync(cordovaAndroidStringsPath)){
            throw new Error(`Android build error: file "${cordovaAndroidStringsPath}" does not exists`);
        }
        android.verify(config);
    },
    
    /**
     * Verify configuration for build iOS IPA
     * @param {Object} config 
     */
    verifyIos(config){
        ios.verify(config);
    },

    /**
     * Inizialize configuration for web app source compile
     */
    initializeSourceCompile(config){
        return inquirer.prompt([{
            type: 'input',
            name: 'compileCommand',
            message: 'Which command I must use to compile app sources?',
            default: 'grunt build:production'
        },{
            type: 'input',
            name: 'compilePath',
            message: 'In which working directory I must execute the command (relative path or absolute one)?',
            default: '.'
        }]).then(({compileCommand, compilePath}) => {
            config.sources.compileCommand = compileCommand;
            config.sources.compilePath = compilePath;
            return config;
        });
    },

    /**
     * Inizialize configuration for change version task
     */
    initializeChangeVersion(config){
        return inquirer.prompt([{
            type: 'input',
            name: 'htmlVersionPath',
            message: 'Which HTML file contains <mad-app-version> tag for app version updating?',
            default: 'src/html/partials/login.html'
        }]).then(({htmlVersionPath}) => {
            config.sources.htmlVersionPath = htmlVersionPath;
            return config;
        });
    }
}

module.exports = {
    CORDOVA : Cordova,
    TASKS : TASKS
}