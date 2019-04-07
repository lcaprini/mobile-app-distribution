'use strict';

const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const logger = require('./logger');
const remote = require('./remote');
const email = require('./email');
const utils = require('./utils');

const TASKS = {
    CHANGE_VERSION : 'v',
    BUILD          : 'b',
    DEPLOY_BUILD   : 'd',
    UPLOAD_REPO    : 'u',
    SEND_EMAIL     : 'e'
};

const Angular = {
    /**
     * Build angular app sources using task manager like, grunt, gulp, webpack, ng, ecc...
     */
    build({ sourcePath, buildSourcesCmd, verbose = false }) {
        process.chdir(sourcePath);
        logger.section(`Compile source:\n$ ${buildSourcesCmd}`);
        shell.exec(buildSourcesCmd, { silent : !verbose });
    },

    /**
     * Set app label version in HTML
     */
    changeVersion({ filePath, version, replacingTag }) {
        logger.section(`Set '${version}' as version in ${filePath}`);
        let versionFile = fs.readFileSync(filePath, 'utf-8');
        this.checkReplacingTag({
            filePath,
            replacingTag,
            checkBuildTask : false
        });
        try {
            let newVersionFile = versionFile.replace(replacingTag, version);
            versionFile = newVersionFile;
            fs.writeFileSync(filePath, versionFile, 'utf-8');
        }
        catch (err) {
            logger.error(err);
        }
    },

    /**
     * Compose email for
     */
    composeEmail({
    appName,
    appLabel,
    appVersion,
    changelog,
    releaseDate,
    repoHomepageUrl,
    androidBuildPath = null,
    iosBuildPath = null
  }) {
        let bodyEmail = fs
      .readFileSync(
        path.join(__dirname, '../resources/distribute-email.tmpl.html')
      )
      .toString();

        bodyEmail = bodyEmail.replace(/___APP_LABEL___/g, appLabel);
        bodyEmail = bodyEmail.replace(/___APP_NAME___/g, appName);
        bodyEmail = bodyEmail.replace(/___APP_VERSION___/g, appVersion);

        let htmlChangelog = '';
        for (let i = 0; i < changelog.length; i++) {
            htmlChangelog += `✓ ${changelog[i]} <br/>`;
        }

        bodyEmail = bodyEmail.replace(/___CHANGELOG___/g, htmlChangelog);
        bodyEmail = bodyEmail.replace(/___RELEASE_DATE___/g, releaseDate);
        bodyEmail = bodyEmail.replace(/___REPO_HOMEPAGE_URL___/g, repoHomepageUrl);

        const androidDirectDownload = androidBuildPath;
        const iosDirectDownload = iosBuildPath
      ? 'itms-services://?action=download-manifest&url=' + iosBuildPath
      : null;

        if (androidDirectDownload) {
            bodyEmail = bodyEmail.replace(
        /___ANDROID_DIRECT_DOWNLOAD_URL___/g,
        androidDirectDownload
      );
            bodyEmail = bodyEmail.replace(
        /___ANDROID_DIRECT_DOWNLOAD_ENCODED_URL___/g,
        encodeURIComponent(androidDirectDownload)
      );
            bodyEmail = bodyEmail.replace(
        /___ANDROID_DOWNLOAD_NOT_AVAILABLE___/g,
        ''
      );
        }
        else {
            bodyEmail = bodyEmail.replace(
        /___ANDROID_DOWNLOAD_NOT_AVAILABLE___/g,
        'hidden'
      );
        }
        if (iosDirectDownload) {
            bodyEmail = bodyEmail.replace(
        /___IOS_DIRECT_DOWNLOAD_URL___/g,
        iosDirectDownload
      );
            bodyEmail = bodyEmail.replace(
        /___IOS_DIRECT_DOWNLOAD_ENCODED_URL___/g,
        encodeURIComponent(iosDirectDownload)
      );
            bodyEmail = bodyEmail.replace(/___IOS_DOWNLOAD_NOT_AVAILABLE___/g, '');
        }
        else {
            bodyEmail = bodyEmail.replace(
        /___IOS_DOWNLOAD_NOT_AVAILABLE___/g,
        'hidden'
      );
        }

        return bodyEmail;
    },

    /**
     * Verify configuration for build and config update steps
     * @param {Object} config
     */
    verifyBuildConfigs(config) {
        if (!config.sources.buildCommand) {
            throw new Error('Source compile error: missing "sources.buildCommand" value in config file');
        }
        if (!fs.existsSync(config.sources.sourcePath)) {
            throw new Error(`Source compile error: directory "sources.sourcePath" doesn't exists at ${config.sources.sourcePath}`
      );
        }
        if (!config.app.version) {
            throw new Error('Invalid build version format: please, see http://semver.org');
        }
    },

    /**
     * Verify configuration for upload build task
     * @param {Object} config
     */
    verifyUploadRepoConfigs(config) {
        if (!config.remote.repo.angularUrlPath) {
            throw new Error('Upload repo error: missing "remote.repo.angularUrlPath" value in config file');
        }
        if (!config.remote.repo.buildsPath) {
            throw new Error('Upload repo error: missing "remote.repo.buildsPath" value in config file');
        }
    },

    /**
     * Verify configuration for change version steps
     * @param {Object} config
     */
    verifyVersionConfigs(config) {
        if (!config.sources.updateVersion.filePath) {
            throw new Error('Version change error: missing "sources.updateVersion.filePath" value in config file');
        }
        if (!fs.existsSync(config.sources.updateVersion.filePath) && !config.tasks.contains(TASKS.BUILD)) {
            throw new Error(`Version change error: file "sources.updateVersion.filePath" doesn't exists at ${config.sources.updateVersion.filePath}`);
        }
        this.checkReplacingTag({
            filePath       : config.sources.updateVersion.filePath,
            replacingTag   : config.sources.updateVersion.replacingTag,
            checkBuildTask : config.tasks.contains(TASKS.BUILD)
        });
    },

    /**
     * Verify replacingTag at filePath if checkBuildTask not exist
     * @param {Object} filePath
     * @param {Object} replacingTag
     * @param {Object} checkBuildTask
     */
    checkReplacingTag({filePath, replacingTag, checkBuildTask}) {
        let versionFile = fs.readFileSync(filePath, 'utf-8');
        if (versionFile.indexOf(replacingTag) === -1 && !checkBuildTask) {
            throw new Error(`Angular change version error: replacingTag ${replacingTag} not found at file path ${filePath}`);
        }
    },

    /**
     * Verify configuration for change deploy and repo upload step
     * @param {Object} config
     */
    verifyBuildDir(config) {
        if (!config.buildsDir) {
            throw new Error('Error: missing "buildsDir" value in config file');
        }
        if (!fs.existsSync(config.buildsDir) && !config.tasks.contains(TASKS.BUILD)) {
            throw new Error(`Error: folder "buildsDir" doesn't exists at ${config.buildsDir}`);
        }
    },

  /**
   * Inizialize configuration for angular build
   */
    initializeSourceBuild(config) {
        return inquirer
            .prompt([
                {
                    type    : 'input',
                    name    : 'buildCommand',
                    message : 'sources.buildCommand',
                    default : 'ng build'
                },
                {
                    type    : 'input',
                    name    : 'sourcePath',
                    message : 'sources.sourcePath',
                    default : './'
                }
            ])
            .then(({ buildCommand, sourcePath }) => {
                if (!config.sources) {
                    config.sources = {};
                }
                config.sources.buildCommand = buildCommand;
                config.sources.sourcePath = sourcePath;
                return config;
            });
    },

    /**
     * Inizialize configuration for change version task
     */
    initializeChangeVersion(config) {
        return inquirer
            .prompt([
                {
                    type    : 'input',
                    name    : 'replacingTag',
                    message : 'sources.updateVersion.replacingTag',
                    default : '{version}'
                },
                {
                    type    : 'input',
                    name    : 'filePath',
                    message : 'sources.updateVersion.filePath',
                    default : 'dist/app_name/index.html'
                }
            ])
            .then(({ replacingTag, filePath }) => {
                if (!config.sources) {
                    config.sources = { updateVersion : {} };
                }
                config.sources.updateVersion.replacingTag = replacingTag;
                config.sources.updateVersion.filePath = filePath;
                return config;
            });
    },

    /**
     * Inizialize general configuration for angular build
     */
    initializeGeneral(config) {
        return inquirer
            .prompt([
                {
                    type    : 'input',
                    name    : 'buildsDir',
                    message : 'buildsDir',
                    default : 'dist/'
                }
            ])
            .then(({ buildsDir }) => {
                config.buildsDir = buildsDir;
                return config;
            });
    },

    /**
     * Inizialize ditribute.json for angular project
     * @param {*} config
     */
    init(config) {
        let angular = this;

        const TASKS = {
            CHANGE_VERSION : 'Change app version in file',
            BUILD          : 'Build angular app',
            DEPLOY_BUILD   : 'Deploy build to server',
            UPLOAD_REPO    : 'Upload build on repo server',
            SEND_EMAIL     : 'Send email to working group'
        };

        return inquirer
            .prompt([
                {
                    type    : 'checkbox',
                    message : 'Which tasks you want configure?',
                    name    : 'tasks',
                    choices : [
                        { name : TASKS.CHANGE_VERSION },
                        { name : TASKS.BUILD },
                        { name : TASKS.DEPLOY_BUILD },
                        { name : TASKS.UPLOAD_REPO },
                        { name : TASKS.SEND_EMAIL }
                    ]
                }
            ])
            .then(({ tasks }) => {
                let questions = [];

                questions.push(angular.initializeGeneral);

                if (tasks.contains(TASKS.CHANGE_VERSION)) {
                    questions.push(angular.initializeChangeVersion);
                }

                if (tasks.contains(TASKS.BUILD)) {
                    questions.push(angular.initializeSourceBuild);
                }

                if (tasks.contains(TASKS.DEPLOY_BUILD)) {
                    questions.push(remote.initializeBuildUpload);
                    questions.push(remote.initializeAngularBuildUpload);
                }

                if (tasks.contains(TASKS.UPLOAD_REPO)) {
                    questions.push(remote.initializeRepoUpdate);
                    questions.push(remote.initializeAngularRepoUpdate);
                }

                if (tasks.contains(TASKS.SEND_EMAIL)) {
                    questions.push(email.initializeSend);
                }

                return utils.askQuestions(questions, config).then(
                    config => {
                        return config;
                    },
                    err => {
                        logger.error(err);
                        process.exit(1);
                    }
                );
            });
    }
};

module.exports = {
    ANGULAR : Angular,
    TASKS   : TASKS
};
