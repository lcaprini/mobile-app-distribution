
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const path = require('path');

const logger = require('./logger');
const android = require('./android');
const ios = require('./ios');

class Config {

    constructor() {
        this.verbose = true;
        this.force = true;
        this.hidden = true;
        this.rootPath = '';
        this.appVersion = '';
        this.androidVersionCode = '';
        this.iosBundleVersion = '';
        this.appVersionLabel = '';
        this.appName = '';
        this.appLabel = '';
        this.appUrlSchema = '';
        this.srcSourcesPath = '';
        this.cmdCompileSources = '';
        this.cordovaRootPath = '';
        this.iosBundleId = '';
        this.iosProvisioningProfile = '';
        this.iosIpaUrlPath = '';
        this.cmdCordovaIOS = 'cordova build ios';
        this.androidBundleId = '';
        this.androidKeystorePath = '';
        this.androidKeystoreAlias = '';
        this.androidKeystorePassword = '';
        this.androidApkUrlPath = '';
        this.cmdCordovaAndroid = 'cordova build --release android';
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
        this.tasks = 'vciafj';
        this.changeLog = 'No changelog';
    }

    init({configPath, program}) {

        let config = this;

        return fs.readFileAsync(configPath, 'utf8').then(
            fileData => {

                const configData = JSON.parse(fileData);

                // Set all configurations from JSON
                _.each(configData, (value, key) => {
                    var camelCasedKey = key.replace(/[-]([a-z])/g, g => { return g[1].toUpperCase(); });
                    config[camelCasedKey] = value;
                });

                config.rootPath = path.dirname(configPath);

                config.appVersionLabel = (program.appVersionLabel) ? program.appVersionLabel : config.appVersion;

                config.androidVersionCode = (program.androidVersionCode) ? program.androidVersionCode : android.calculateVersionCode();

                config.iosBundleVersion = (program.iosBundleVersion) ? program.iosBundleVersion : ios.calculateBundleVersion();

                config.hidden = (_.isBoolean(program.hidden)) ? program.hidden : false;
                if(config.hidden){
                    config.appVersionLabel += '-[DEV]';
                }

                config.tasks = (program.tasks) ? program.tasks : 'vciafjze';

                config.verbose = (_.isBoolean(program.verbose)) ? program.verbose : false;

                config.force = (_.isBoolean(program.force)) ? program.force : false;

                if(program.changeLog){
                    // If changelog is file I try to read it
                    return fs.readFileAsync(program.changeLog, 'utf8').then(
                        changeLogText => {
                            config.changeLog = changeLogText.split('\n').join('***');
                        },
                        () => {
                            var changeLogPath = path.join(config.rootPath, program.changeLog);
                            return fs.readFileAsync(changeLogPath, 'utf8').then(
                                changeLogText => {
                                    config.changeLog = changeLogText.split('\n').join('***');
                                },
                                () => {
                                    config.changeLog = program.changeLog;
                                });
                        });
                }
            }
        );
    }

    setAppVersion(version) {
        this.appVersion = version;
    }

}

module.exports = new Config();