'use strict';

const asciimo = require('asciimo').Figlet;
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const path = require('path');
const findVersions = require('find-versions');

const logger = require('./logger');
const utils = require('./utils');
const cordovaTasks = require('./cordova').TASKS;
const cordova = require('./cordova').CORDOVA;
const android = require('./android');
const ios = require('./ios');
const repo = require('./repo');

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
        
        this.appVersion = '';
        this.appVersionLabel = '';
        this.appName = '';
        this.appLabel = '';
        this.appSchema = '';

        // Souces
        this.changeVersionHtmlPath = '';
        this.compileSourcesPath = '';
        this.compileSourcesCmd = '';
        this.sourcePath = '';
        this.cordovaPath = '';
        this.cordovaConfigPath = '';

        // Cordova
        this.cordovaRootPath = '';
        this.cmdCordovaIos = 'cordova build ios';
        this.cmdCordovaAndroid = 'cordova build --release android';
        
        // Builds
        this.buildsDir = 'builds/';

        // iOS
        this.iosBundleVersion = '';
        this.iosBundleId = '';
        this.iosProvisioningProfile = '';
        this.iosInfoPlistPath = '';

        // Android
        this.androidVersionCode = '';
        this.androidBundleId = '';
        this.androidKeystorePath = '';
        this.androidKeystoreAlias = '';
        this.androidKeystorePassword = '';
        
        // FTP Builds
        this.ftpBuildsHost = '';
        this.ftpBuildsPort = 21;
        this.ftpBuildsUser = '';
        this.ftpBuildsPassword = '';
        this.ftpBuildsIOSDestinationPath = '';
        this.ftpBuildsAndroidDestinationPath = '';

        // FTP Repository
        this.ftpRepoHost = '';
        this.ftpRepoPort = 21;
        this.ftpRepoUser = '';
        this.ftpRepoPassword = '';
        this.ftpRepoJsonPath = '';
        this.repoIOSUrlPath = '';
        this.repoAndroidUrlPath = '';
        this.repoHomepageUrl = '';

        // FTP Sources
        this.ftpSourcesHost = '';
        this.ftpSourcesPort = 21;
        this.ftpSourcesUser = '';
        this.ftpSourcesPassword = '';
        this.ftpSourcesDestinationPath = '';

        // Email
        this.emailHost = '';
        this.emailPort = 25;
        this.emailUser = '';
        this.emailPassword = '';
        this.emailFrom = '';
        this.emailTo = [];
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
                        config.versionHTMLPath = path.isAbsolute(config.changeVersionHtmlPath)? config.changeVersionHtmlPath : path.join(config.rootPath, config.changeVersionHtmlPath);
                        config.cordovaPath = path.isAbsolute(config.cordovaRootPath)? config.cordovaRootPath : path.join(config.rootPath, config.cordovaRootPath);
                        config.cordovaConfigPath = path.join(config.cordovaPath, './config.xml');
                        config.buildsDir = path.isAbsolute(config.buildsDir)? config.buildsDir : path.join(config.rootPath, config.buildsDir);
                        
                        config.androidKeystorePath = path.isAbsolute(config.androidKeystorePath)? config.androidKeystorePath : path.join(config.rootPath, config.androidKeystorePath);
                        config.apkFileName = `${config.appLabel}_v.${config.appVersionLabel}.apk`.replace(/ /g, '_');
                        config.apkFilePath = path.join(config.buildsDir, config.apkFileName);
                        
                        if(config.iosInfoPlistPath){
                            config.iosInfoPlistPath = path.isAbsolute(config.iosInfoPlistPath)? config.iosInfoPlistPath : path.join(config.rootPath, config.iosInfoPlistPath);
                        }
                        
                        config.ftpRepoJsonPath = path.join(config.ftpRepoJsonPath, './builds.json');

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
                            if(err){
                                reject(err);
                                return;
                            }
                            try{
                                config.verify();
                                resolve();
                            }
                            catch(e){
                                reject(e);
                            }
                        });
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

        const changeLogPath = path.isAbsolute(changeLog)? changeLog : path.join(config.rootPath, changeLog);
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
            cordova.verifyCompileConfigs(this);
        }

        // Check params for sources compiler steps
        if(this.tasks.contains(cordovaTasks.CHANGE_VERSION)){
            cordova.verifyVersionConfigs(this);
        }

        // Check params for iOS app builder
        if(this.tasks.contains(cordovaTasks.BUILD_IOS)){
            cordova.verifyIos(this);
        }

        // Check params for Android app builder
        if(this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            cordova.verifyAndroid(this);
        }

        // Check params for FTP build uploader
        if(this.tasks.contains(cordovaTasks.UPLOAD_BUILDS)){
            this.verifyUploadBuildsSteps();
        }

        // Check params for FTP sources upload
        if(this.tasks.contains(cordovaTasks.UPLOAD_SOURCES)){
            this.verifyUploadSourcesSteps();
        }

        // Check params for FTP sources upload
        if(this.tasks.contains(cordovaTasks.SEND_EMAIL)){
            this.verifySendEmailSteps();
        }
    }

    verifyUploadBuildsSteps(){
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
        if(this.tasks.contains(cordovaTasks.BUILD_IOS) || this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            repo.verify(this);
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

    verifyUploadSourcesSteps(){
        if(!this.ftpSourcesHost){
            throw new Error('FTP sources upload error: missing "ftp-sources-hosts" value in config file');
        }
        if(!this.ftpSourcesUser){
            throw new Error('FTP sources upload error: missing "ftp-sources-user" value in config file');
        }
        if(!this.ftpSourcesPassword){
            throw new Error('FTP sources upload error: missing "ftp-sources-password" value in config file');
        }
        if(!this.ftpSourcesDestinationPath){
            throw new Error('FTP sources upload error: missing "ftp-sources-working-dir" value in config file');
        }
    }

    verifySendEmailSteps(){
        if(!this.emailHost){
            throw new Error('Send email error: missing "email-host" value in config file');
        }
        if(!this.emailPort){
            throw new Error('Send email error: missing "email-port" value in config file');
        }
        if(!this.emailUser){
            throw new Error('Send email error: missing "email-user" value in config file');
        }
        if(!this.emailPassword){
            throw new Error('Send email error: missing "email-password" value in config file');
        }
        if(!this.emailFrom){
            throw new Error('Send email error: missing "email-from" value in config file');
        }
        if(!this.emailTo){
            throw new Error('Send email error: missing "email-to" value in config file');
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