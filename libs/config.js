
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const path = require('path');
const findVersions = require('find-versions');

const logger = require('./logger');
const android = require('./android');
const ios = require('./ios');


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
        this.appUrlSchema = '';

        this.srcSourcesPath = '';
        this.cmdCompileSources = '';
        this.cordovaRootPath = '';

        this.cmdCordovaIOS = 'cordova build ios';
        this.iosBundleVersion = '';
        this.iosBundleId = '';
        this.iosProvisioningProfile = '';
        this.iosIpaUrlPath = '';

        this.cmdCordovaAndroid = 'cordova build --release android';
        this.androidVersionCode = '';
        this.androidBundleId = '';
        this.androidKeystorePath = '';
        this.androidKeystoreAlias = '';
        this.androidKeystorePassword = '';
        this.androidApkUrlPath = '';
        
        this.ftpBuildsHost = '';
        this.ftpBuildsUsername = '';
        this.ftpBuildsPassword = '';
        this.ftpBuildsIOSWorkingDir = '';
        this.ftpBuildsAndroidWorkingDir = '';

        this.ftpSourcesHost = '';
        this.ftpSourcesUsername = '';
        this.ftpSourcesPassword = '';
        this.ftpSourcesWorkingDir = '';

        this.ftpRepoHost = '';
        this.ftpRepoUsername = '';
        this.ftpRepoPassword = '';
        this.ftpBuildsIOSWorkingDir = '';
        this.ftpBuildsAndroidWorkingDir = '';
        
        this.ftpSourcesHost = '';
        this.ftpSourcesUsername = '';
        this.ftpSourcesPassword = '';
        this.ftpSourcesWorkingDir = '';

        this.ftpRepoHost = '';
        this.ftpRepoUsername = '';
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

        return new Promise(function(resolve, reject) {
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

                        // Set task list
                        config.tasks = program.tasks.split();

                        // Set verbose mode
                        config.verbose = (_.isBoolean(program.verbose)) ? program.verbose : false;

                        // Set force mode
                        config.force = (_.isBoolean(program.force)) ? program.force : false;

                        if(program.changeLog){
                            // If changelog is file I try to read it
                            fs.readFileAsync(program.changeLog, 'utf8').then(
                                changeLogText => {
                                    config.changeLog = changeLogText.split('\n').join('***');
                                    resolve();
                                },
                                () => {
                                    var changeLogPath = path.join(config.rootPath, program.changeLog);
                                    return fs.readFileAsync(changeLogPath, 'utf8').then(
                                        changeLogText => {
                                            config.changeLog = changeLogText.split('\n').join('***');
                                            resolve();
                                        },
                                        () => {
                                            config.changeLog = program.changeLog;
                                            resolve();
                                        });
                                });
                        }
                    }
                    catch(e){
                        reject(e);
                    }
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
        this.iosBundleVersion = (program.iosBundleVersion) ? program.iosBundleVersion : ios.calculateBundleVersion(this.appVersion);

        // Set if builds are hidden on wireless distribution html page
        if(_.isBoolean(program.hidden))
            this.hidden = program.hidden

        if(this.hidden){
            this.appVersionLabel += '-[DEV]';
        }
    }
}

module.exports = new Config();