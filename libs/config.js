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

        this.app = {
            name : '',
            label : '',
            version : '',
            versionLabel : ''
        };

        this.sources = {
            compilePath: '',
            htmlVersionPath : '',
            compileCommand : '',
        };

        this.cordova = {
            path : '',
            configPath : '',
            rootPath : '',
            buildIosCommand : 'cordova build ios',
            buildAndroidCommand : 'cordova build --release android'
        };
        
        this.buildsDir = 'builds/';

        this.ios = {
            bundleId : '',
            bundleVersion : '',
            infoPlistPath : '',
            targetSchema : '',
            exportOptionsPlist : {
                method : 'enterprise',
                teamID : '',
                uploadSymbols : false,
                uploadBitcode : false
            },
            exportOptionsPlistPath : ''
        };

        this.android = {
            bundleId : '',
            versionCode : '',
            keystore : {
                path : '',
                alias : '',
                password : ''
            }
        };

        this.remote = {

            builds : {
                host : '',
                port : 21,
                user : '',
                password : '',
                iosDestinationPath : '',
                androidDestinationPath : ''
            },

            repo : {
                host : '',
                port : 21,
                user : '',
                password : '',
                jsonPath : '',
                iosUrlPath : '',
                androidUrlPath : '',
                homepageUrl : ''
            },

            sources : {
                host : '',
                port : 21,
                user : '',
                password : '',
                destinationPath : '',
            }
        }

        this.email = {
            host : '',
            port : 25,
            user : '',
            password : '',
            from : '',
            to : []
        }
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
                        _.merge(config, configData);

                        // Set project root dir
                        config.rootPath = path.dirname(configPath);
                        // Calculate and set other dirs
                        config.sources.compilePath = path.isAbsolute(config.sources.compilePath)? config.sources.compilePath : path.join(config.rootPath, config.sources.compilePath);
                        config.sources.htmlVersionPath = path.isAbsolute(config.sources.htmlVersionPath)? config.sources.htmlVersionPath : path.join(config.rootPath, config.sources.htmlVersionPath);
                        config.cordova.path = path.isAbsolute(config.cordova.rootPath)? config.cordova.rootPath : path.join(config.rootPath, config.cordova.rootPath);
                        config.cordova.configPath = path.join(config.cordova.path, './config.xml');
                        config.buildsDir = path.isAbsolute(config.buildsDir)? config.buildsDir : path.join(config.rootPath, config.buildsDir);
                        
                        config.android.keystore.path = path.isAbsolute(config.android.keystore.path)? config.android.keystore.path : path.join(config.rootPath, config.android.keystore.path);
                        config.android.apkFileName = `${config.app.label}_v.${config.app.versionLabel}.apk`.replace(/ /g, '_');
                        config.android.apkFilePath = path.join(config.buildsDir, config.android.apkFileName);
                        
                        if(config.ios.infoPlistPath){
                            config.ios.infoPlistPath = path.isAbsolute(config.ios.infoPlistPath)? config.ios.infoPlistPath : path.join(config.rootPath, config.ios.infoPlistPath);
                        }
                        if(config.ios.exportOptionsPlistPath){
                            config.ios.exportOptionsPlistPath = path.isAbsolute(config.ios.exportOptionsPlistPath)? config.ios.exportOptionsPlistPath : path.join(config.rootPath, config.ios.exportOptionsPlistPath);
                        }
                        
                        config.remote.repo.jsonPath = path.join(config.remote.repo.jsonPath, './builds.json');

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
        this.app.version = version[0];

        // Set app version label from program args
        this.app.versionLabel = program.args[0];

        // Set Android Version Code
        this.android.versionCode = (program.androidVersionCode)? program.androidVersionCode : android.calculateVersionCode(this.app.version);

        // Set iOS Bundle Version
        this.ios.bundleVersion = (program.iosBundleVersion)? program.iosBundleVersion : ios.calculateBundleVersion(this.app.version);

        // Set if builds are hidden on wireless distribution html page
        if(_.isBoolean(program.hidden))
            this.hidden = program.hidden

        if(this.hidden){
            this.app.versionLabel += '-[DEV]';
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
        if(!this.remote.builds.host){
            throw new Error('FTP build upload error: missing "remote.builds.hosts" value in config file');
        }
        if(!this.remote.builds.port){
            throw new Error('FTP build upload error: missing "remote.builds.port" value in config file');
        }
        if(!this.remote.builds.user){
            throw new Error('FTP build upload error: missing "remote.builds.user" value in config file');
        }
        if(!this.remote.builds.password){
            throw new Error('FTP build upload error: missing "remote.builds.password" value in config file');
        }
        if(this.tasks.contains(cordovaTasks.BUILD_IOS) || this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            repo.verify(this);
        }
        if(this.tasks.contains(cordovaTasks.BUILD_IOS)){
            if(!this.remote.builds.iosDestinationPath){
                throw new Error('FTP+iOS upload error: missing "remote.builds.iosDestinationPath" value in config file');
            }
        }
        if(this.tasks.contains(cordovaTasks.BUILD_ANDROID)){
            if(!this.remote.builds.androidDestinationPath){
                throw new Error('FTP+Android upload error: missing "remote.builds.androidDestinationPath" value in config file');
            }
        }
    }

    verifyUploadSourcesSteps(){
        if(!this.remote.sources.host){
            throw new Error('FTP sources upload error: missing "remote.sources.hosts" value in config file');
        }
        if(!this.remote.sources.user){
            throw new Error('FTP sources upload error: missing "remote.sources.user" value in config file');
        }
        if(!this.remote.sources.password){
            throw new Error('FTP sources upload error: missing "remote.sources.password" value in config file');
        }
        if(!this.remote.sources.destinationPath){
            throw new Error('FTP sources upload error: missing "remote.sources.destinationPath" value in config file');
        }
    }

    verifySendEmailSteps(){
        if(!this.email.host){
            throw new Error('Send email error: missing "email.host" value in config file');
        }
        if(!this.email.port){
            throw new Error('Send email error: missing "email.port" value in config file');
        }
        if(!this.email.user){
            throw new Error('Send email error: missing "email.user" value in config file');
        }
        if(!this.email.password){
            throw new Error('Send email error: missing "email.password" value in config file');
        }
        if(!this.email.from){
            throw new Error('Send email error: missing "email.from" value in config file');
        }
        if(!this.email.to){
            throw new Error('Send email error: missing "email.to" value in config file');
        }
    }

    printRecap() {
        const config = this;
        return new Promise(resolve => {
            asciimo.write('  '+config.app.name, 'Ogre', art => {
                logger.info('\n#########################################################');
                logger.info(art);
                logger.info('#########################################################');
                logger.info('  App name:\t\t\t',                   config.app.name);
                logger.info('  App label:\t\t\t',                  config.app.label);
                logger.info('  App version:\t\t\t',                config.app.version);
                logger.info('  App version label:\t\t',            config.app.versionLabel);
                if(config.tasks.contains(cordovaTasks.BUILD_IOS)){
                    logger.info('  iOS bundle id:\t\t',            config.ios.bundleId);
                    logger.info('  iOS bundle version:\t\t',       config.ios.bundleVersion);
                }
                if(config.tasks.contains(cordovaTasks.BUILD_ANDROID)){
                    logger.info('  Android bundle id:\t\t',        config.android.bundleId);
                    logger.info('  Android version code:\t\t',     config.android.versionCode);
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