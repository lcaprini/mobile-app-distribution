'use strict';

const asciimo = require('asciimo').Figlet;
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const path = require('path');
const findVersions = require('find-versions');
const shell = require('shelljs');
const commandExists = require('command-exists').sync;

const logger = require('./logger');
const utils = require('./utils');
const cordova = require('./cordova');
const android = require('./android');
const ios = require('./ios');
const cordovaTasks = require('./cordova').TASKS;

class Config {

    constructor() {
        this.verbose = false;
        this.force = false;
        this.hidden = false;
        
        this.path = 'distribute.json';
        this.rootPath = '';
        this.tasks = 'vciafjze';

        this.changeLog = 'No changelog';
        
        this.appVersion = '';
        this.appVersionLabel = '';
        this.appName = '';
        this.appLabel = '';
        this.appSchema = '';

        this.compileSourcesPath = '';
        this.compileSourcesCmd = '';
        this.sourcePath = '';
        this.cordovaPath = '';
        this.cordovaConfigPath = '';

        this.cordovaRootPath = '';

        this.cmdCordovaIOS = 'cordova build ios';
        this.iosBundleVersion = '';
        this.iosBundleId = '';
        this.iosProvisioningProfile = '';

        this.cmdCordovaAndroid = 'cordova build --release android';
        this.androidProjectPath = '';
        this.androidVersionCode = '';
        this.androidBundleId = '';
        this.androidKeystorePath = '';
        this.androidKeystoreAlias = '';
        this.androidKeystorePassword = '';
        
        this.ftpBuildsHost = '';
        this.ftpBuildsPort = 21;
        this.ftpBuildsUser = '';
        this.ftpBuildsPassword = '';
        this.ftpBuildsIOSDestinationPath = '';
        this.ftpBuildsIOSUrlPath = '';
        this.ftpBuildsAndroidDestinationPath = '';
        this.ftpBuildsAndroidUrlPath = '';

        this.ftpSourcesHost = '';
        this.ftpSourcesPort = 21;
        this.ftpSourcesUser = '';
        this.ftpSourcesPassword = '';
        this.ftpSourcesDestinationPath = '';

        this.ftpRepoHost = '';
        this.ftpRepoPort = 21;
        this.ftpRepoUser = '';
        this.ftpRepoPassword = '';
        this.ftpBuildsIOSDestinationPath = '';
        this.ftpBuildsAndroidDestinationPath = '';
        
        this.ftpSourcesHost = '';
        this.ftpSourcesUser = '';
        this.ftpSourcesPassword = '';
        this.ftpSourcesDestinationPath = '';

        this.ftpRepoHost = '';
        this.ftpRepoUser = '';
        this.ftpRepoPassword = '';
        this.ftpRepoWorkingDir = '';
        this.wirelessDistUrlPage = '';

        this.smtpServer = '';
        this.smtpPort = 25;
        this.smtpUser = '';
        this.smtpPass = '';
        this.mailFrom = '';
        this.mailTo = [];

        this.buildsDir = 'builds/';
    }

    init({configPath, program}) {
        let config = this;
        
        return new Promise((resolve, reject) => {
            fs.readFileAsync(configPath, 'utf8').then(
                fileData => {
                    try{

                        // Verify and set app version
                        config.setBuildVersion(program);

                        const configData = JSON.parse(fileData);

                        // Set all configurations from JSON
                        _.each(configData, (value, key) => {
                            var camelCasedKey = key.replace(/[-]([a-z])/g, g => { return g[1].toUpperCase(); });
                            config[camelCasedKey] = value;
                        });

                        // Set project root dir
                        config.rootPath = path.dirname(configPath);
                        // Calculate and set other dirs
                        config.sourcePath = path.isAbsolute(config.compileSourcesPath)? config.compileSourcesPath : path.join(config.rootPath, config.compileSourcesPath);
                        config.cordovaPath = path.isAbsolute(config.cordovaRootPath)? config.cordovaRootPath : path.join(config.rootPath, config.cordovaRootPath);
                        config.cordovaConfigPath = path.join(config.cordovaPath, './config.xml');
                        config.buildsDir = path.isAbsolute(config.buildsDir)? config.buildsDir : path.join(config.rootPath, config.buildsDir);
                        config.androidProjectPath = path.join(config.cordovaPath, './platforms/android');
                        config.androidKeystorePath = path.isAbsolute(config.androidKeystorePath)? config.androidKeystorePath : path.join(config.rootPath, config.androidKeystorePath);
                        config.apkFileName = `${config.appLabel}_v.${config.appVersionLabel}.apk`.replace(/ /g, '_');
                        config.apkFilePath = path.join(config.buildsDir, config.apkFileName);

                        logger.setFileLogger(config.rootPath);

                        // Set task list
                        config.tasks = program.tasks.split('');

                        // Set verbose mode
                        config.verbose = (_.isBoolean(program.verbose)) ? program.verbose : false;

                        // Set force mode
                        config.force = (_.isBoolean(program.force)) ? program.force : false;

                        if(program.changeLog){
                            config.readChangeLog(program.changeLog, (err, next) => {
                                if(err){
                                    reject(err);
                                    return;
                                }

                                config.verify();
                                resolve();
                            });
                        }
                    }
                    catch(e){
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
        let version = findVersions(program.args[0], {loose: true});
        if (!version[0]) {
            throw new Error('Invalid build version format: please, see http://semver.org');
        }

        // Set app version
        this.appVersion = version[0];

        // Set app version label from program args
        this.appVersionLabel = program.args[0];

        // Set Android Version Code
        this.androidVersionCode = (program.androidVersionCode) ? program.androidVersionCode : android.calculateVersionCode(this.appVersion);

        // Set iOS Bundle Version
        this.iosBundleVersion = ios.calculateBundleVersion(this.appVersion);

        // Set if builds are hidden on wireless distribution html page
        if(_.isBoolean(program.hidden))
            this.hidden = program.hidden

        if(this.hidden){
            this.appVersionLabel += '-[DEV]';
        }
    }

    readChangeLog(changeLog, next){
        let config = this;

        const changeLogPath = path.join(config.rootPath, changeLog);
        return fs.readFileAsync(changeLogPath, 'utf8').then(
            changeLogText => {
                config.changeLog = changeLogText.split('\n');
                next();
            },
            () => {
                config.changeLog = changeLog.split('***');
                next();
            });
    }

    /**
     * Verifies all configuration and params
     */
    verify(){

        // Check params for sources compiler steps
        if(this.tasks.contains(cordovaTasks.COMPILE_SOURCES)){
            cordova.verifyConfigs(this);
        }

        // Check params for iOS app builder
        if(this.tasks.contains(cordovaTasks.BUILD_IOS)){
            this.verifyIosSteps();
        }

        // Check params for Android app builder
        if(this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            const cordovaAndroidStringsPath = path.join(this.cordovaPath, './platforms/android/res/values/strings.xml');
            if(!fs.existsSync(cordovaAndroidStringsPath)){
                throw new Error(`Android build error: file "${cordovaAndroidStringsPath}" doesn\'t exists`);
            }
            this.verifyAndroidSteps();
        }

        // Check params for FTP build uploader
        if(this.tasks.contains(cordovaTasks.UPLOAD_BUILDS)){
            this.verifyBuildUploadSteps();
        }

        // Check params for repo update
        if(this.tasks.contains(cordovaTasks.UPDATE_REPO)){
            this.verifyUpdateRepoSteps();
        }

        // Check params for FTP sources upload
        if(this.tasks.contains(cordovaTasks.UPLOAD_SOURCES)){
            this.verifySourcesUploadSteps();
        }

        // Check params for FTP sources upload
        if(this.tasks.contains(cordovaTasks.SEND_EMAIL)){
            this.verifySendEmailSteps();
        }
    }

    verifyIosSteps(){
        if(!this.iosBundleId){
            throw new Error('iOS build error: missing "ios-bundle-id" value in config file');
        }
        if(!this.iosProvisioningProfile){
            throw new Error('iOS build error: missing "ios-provisioning-profile" value in config file');
        }
        if(!this.ftpBuildsIOSUrlPath){
            throw new Error('iOS build error: missing "ios-ipa-url-path" value in config file');
        }
        if(!this.buildsDir){
            throw new Error('iOS build error: missing "builds-dir" value in config file');
        }
    }

    verifyAndroidSteps(){
        if(!this.androidBundleId){
            throw new Error('Android build error: missing "android-bundle-id" value in config file');
        }
        if(!fs.existsSync(this.androidProjectPath)){
            throw new Error(`Android build error: no Android project in "${this.androidProjectPath}" directory`);
        }
        if(!fs.existsSync(this.androidKeystorePath)){
            throw new Error(`Android build error: missing file "${this.androidKeystorePath}"`);
        }
        if(!this.androidKeystoreAlias){
            throw new Error('Android build error: missing "android-keystore-alias" value in config file');
        }
        if(!this.androidKeystorePassword){
            throw new Error('Android build error: missing "android-keystore-password" value in config file');
        }
        if(!fs.existsSync(this.buildsDir)){
            utils.createPath({workingPath:this.rootPath, path:this.buildsDir});
        }
        if(!commandExists('jarsigner')){
            throw new Error('Android build error: command "jarsigner" not found, please add Android SDK tools in $PATH');
        }
        if(!commandExists('zipalign')){
            throw new Error('Android build error: command "zipalign" not found, please add last Android SDK build-tools in $PATH');
        }
    }

    verifyBuildUploadSteps(){
        if(!this.ftpBuildsHost){
            throw new Error('FTP build upload error: missing "ftp-builds-hosts" value in config file');
        }
        if(!this.ftpBuildsPort){
            throw new Error('FTP build upload error: missing "ftp-builds-port" value in config file');
        }
        if(!this.ftpBuildsUser){
            throw new Error('FTP build upload error: missing "ftp-builds-user" value in config file');
        }
        if(!this.ftpBuildsPassword){
            throw new Error('FTP build upload error: missing "ftp-builds-password" value in config file');
        }
        if(this.tasks.contains(cordovaTasks.BUILD_IOS)){
            if(!this.ftpBuildsIOSDestinationPath){
                throw new Error('FTP+iOS upload error: missing "ftp-builds-ios-working-dir" value in config file');
            }
        }
        if(this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            if(!this.ftpBuildsAndroidDestinationPath){
                throw new Error('FTP+Android upload error: missing "ftp-builds-android-working-dir" value in config file');
            }
        }
    }

    verifyUpdateRepoSteps(){
        if(!this.ftpRepoHost){
            throw new Error('Repo update error: missing "ftp-repo-hosts" value in config file');
        }
        if(!this.ftpRepoUser){
            throw new Error('Repo update error: missing "ftp-repo-user" value in config file');
        }
        if(!this.ftpRepoPassword){
            throw new Error('Repo update error: missing "ftp-repo-password" value in config file');
        }
        if(!this.ftpRepoWorkingDir){
            throw new Error('Repo update error: missing "ftp-repo-working-dir" value in config file');
        }
        if(!this.wirelessDistUrlPage){
            throw new Error('Repo update error: missing "wireless-dist-url-page" value in config file');
        }
        // if(!this.ftpBuildsAndroidUrlPath){
        //     throw new Error('Android build error: missing "android-apk-url-path" value in config file');
        // }
    }

    verifySourcesUploadSteps(){
        if(!this.ftpSourcesHost){
            throw new Error('FTP sources upload error: missing "ftp-sources-hosts" value in config file');
        }
        if(!this.ftpSourcesUser){
            throw new Error('FTP sources upload error: missing "ftp-sources-user" value in config file');
        }
        if(!ftpSourcesPassword){
            throw new Error('FTP sources upload error: missing "ftp-sources-password" value in config file');
        }
        if(!this.ftpSourcesDestinationPath){
            throw new Error('FTP sources upload error: missing "ftp-sources-working-dir" value in config file');
        }
    }

    verifySendEmailSteps(){
        if(!this.smtpServer){
            throw new Error('Send email error: missing "smtp-server" value in config file');
        }
        if(!this.smtpPort){
            throw new Error('Send email error: missing "smtp-port" value in config file');
        }
        if(!this.smtpUser){
            throw new Error('Send email error: missing "smtp-user" value in config file');
        }
        if(!this.smtpPass){
            throw new Error('Send email error: missing "smtp-pass" value in config file');
        }
        if(!this.mailFrom){
            throw new Error('Send email error: missing "mail-from" value in config file');
        }
        if(!this.mailTo){
            throw new Error('Send email error: missing "mail-to" value in config file');
        }
    }

    printRecap() {
        const config = this;
        return new Promise(resolve => {
            asciimo.write('  '+config.appName, 'Ogre', art => {
                logger.info('\n#########################################################');
                logger.info(art);
                logger.info('#########################################################');
                logger.info('  App name:\t\t\t',                   config.appName);
                logger.info('  App label:\t\t\t',                  config.appLabel);
                logger.info('  App version:\t\t\t',                config.appVersion);
                logger.info('  App version label:\t\t',            config.appVersionLabel);
                if(config.tasks.contains(cordovaTasks.BUILD_IOS)){
                    logger.info('  iOS bundle id:\t\t',            config.iosBundleId);
                    logger.info('  iOS provisioning profile:\t',   config.iosProvisioningProfile);
                    logger.info('  iOS bundle version:\t\t',       config.iosBundleVersion);
                }
                if(config.tasks.contains(cordovaTasks.BUILD_ANDROID)){
                    logger.info('  Android bundle id:\t\t',        config.androidBundleId);
                    logger.info('  Android version code:\t\t',     config.androidVersionCode);
                }
                logger.info('  Change log:\t\t\t',                 config.changeLog[0])
                for(let i = 1; i < config.changeLog.length; i++){
                    logger.info('\t\t\t\t',                        config.changeLog[i]);
                }
                logger.info('#########################################################\n');

                const validateRecap = resolve => {
                    utils.prompt('Press \'y\' to continue the build process, \'n\' to stop it').then(
                        result => {
                            if(result == 'y'){
                                resolve();
                            }
                            else if(result == 'n'){
                                logger.info('\n\nExit process...\n\n');
                                process.exit(0);
                            }
                            else{
                                validateRecap(resolve);
                            }
                        },
                        err => {
                            logger.error(err);
                            process.exit(1);
                        }
                    )
                }
                if(config.force){
                    resolve();
                }
                else{
                    validateRecap(resolve);
                }
            });
        });
    }
}

module.exports = new Config();