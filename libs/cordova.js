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
        logger.section(`Set version in config.xml to ${appVersion}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setVersion(appVersion);
        config.writeSync();
    },

    /**
     * Set app label version in HTML
     */
    changeVersion({filePath, version}){
        logger.section(`Set version ${version} in ${filePath} HTML`);
        let versionFile = fs.readFileSync(filePath, 'utf-8');
        try{
            let newVersionFile = versionFile.replace(/<mad-app-version.*>([\s\S]*?)<\/mad-app-version>/ig, `<mad-app-version> ${version} </mad-app-version>`);
            console.log(newVersionFile);
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
        logger.section(`Set id in config.xml to ${id}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setID(id);
        config.writeSync();
    },

    /**
     * Set Android version code in config.xml using cordova-config module
     */
    setAndroidVersionCode({cordovaPath, versionCode}){
        logger.section(`Set Android version code in config.xml to ${versionCode}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setAndroidVersionCode(versionCode);
        config.writeSync();
    },

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
    },

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
    },

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
    },

    /**
     * Set iOS version code in config.xml using cordova-config module
     */
    setIosBundleVersion({cordovaPath, bundleVersion}){
        logger.section(`Set Ios bundle version in config.xml to ${bundleVersion}`);
        const cordovaConfigPath = path.join(cordovaPath, './config.xml');
        const config = new Config(cordovaConfigPath);
        config.setIOSBundleVersion(bundleVersion);
        config.writeSync();
    },

    /**
     * Exec all task to prepare and build the iOS platform
     */
    distributeIos({displayName, id, bundleVersion, cmdCordovaIos = 'cordova build ios', cordovaPath, verbose = false}){
        this.setId({cordovaPath, id});
        this.setIosBundleVersion({cordovaPath, bundleVersion});
    },

    /**
     * Compose email for 
     */
    composeEmail({appName, appLabel, appVersion, hidden, repoHomepageUrl, androidBuildPath = null, iosBuildPath = null}){
        if(hidden){
            repoHomepageUrl += '?all=true';
        }
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
                    <p>You can also directly download the app by scanning the following QRCodes o by tapping on it</p>
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
    },

    /**
     * Verify configuration for change version steps
     * @param {Object} config 
     */
    verifyVersionConfigs(config){
        if(!config.versionHTMLPath){
            throw new Error('Version change error: missing "change-version-html-path" value in config file');
        }
        if(!fs.existsSync(config.versionHTMLPath)){
            throw new Error(`Version change error: file "change-version-html-path" doesn\'t exists at ${config.versionHTMLPath}`);
        }
    },

    /**
     * Verify configuration for build Android APK
     * @param {Object} config 
     */
    verifyAndroid(config){
        const cordovaAndroidStringsPath = path.join(config.cordovaPath, './platforms/android/res/values/strings.xml');
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
    }
}

module.exports = {
    CORDOVA : Cordova,
    TASKS : TASKS
}