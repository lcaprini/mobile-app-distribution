'use strict';

const _ = require('lodash');
const moment = require('moment');
const JSFtp = require('jsftp');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const logger = require('./logger');

const Remote = {

    downloadFile({file, server}) {
        return new Promise((resolve, reject) => {
            let ftp = new JSFtp(server);
            ftp.get(file, (err, socket) => {
                if (err) {
                    reject(new Error(err));
                    throw new Error(err);
                }

                let builds = '';
                socket.on('data', chunk => {
                    builds += chunk.toString();
                });
                socket.on('close', err => {
                    ftp.destroy();
                    if (err) {
                        reject(new Error(err));
                        throw new Error(err);
                    }
                    resolve(builds);
                });
                socket.resume();
            });
        });
    },

    uploadFile({localFile, server, remoteFile}) {
        return new Promise((resolve, reject) => {
            let ftp = new JSFtp(server);
            ftp.put(localFile, remoteFile, err => {
                ftp.destroy();
                if (err) {
                    reject(new Error(err));
                    throw new Error(err);
                }
                resolve();
            });
        });
    },

    updateRepo({repoPath, server, version, hidden, changelog, androidBuildPath = null, iosBuildPath = null, rootPath}) {
        logger.section(`Update repository`);

        return new Promise((resolve, reject) => {
            Remote.downloadFile({file : repoPath, server}).then(
                data => {
                    let jsonFile = JSON.parse(data);
                    let build = _.remove(jsonFile.builds, b => {
                        return b.version === version
                        ;
                    })[0];
                    if (!build) {
                        build = {
                            version,
                            hidden
                        };
                    }
                    build.changelog = changelog;
                    build.date = moment().format('DD/MM/YYYY HH:mm:ss');
                    if (androidBuildPath) {
                        build.androidBuildPath = androidBuildPath;
                    }
                    if (iosBuildPath) {
                        build.iosBuildPath = iosBuildPath;
                    }
                    jsonFile.builds.unshift(build);
                    const tmpJsonFile = path.join(rootPath, `./.builds.json`);
                    fs.writeFileSync(tmpJsonFile, JSON.stringify(jsonFile, null, 4), {encoding : 'utf-8', flag : 'w'});
                    Remote.uploadFile({
                        localFile  : tmpJsonFile,
                        remoteFile : repoPath,
                        server
                    }).then(
                        () => {
                            fs.unlinkSync(tmpJsonFile);
                            resolve();
                        },
                        err => {
                            reject(err);
                        }
                    );
                },
                err => {
                    logger.error(err);
                }
            );
        });
    },

    verifyUploadBuildsSteps(config) {
        if (!config.remote.builds.host) {
            throw new Error('FTP build upload error: missing "remote.builds.hosts" value in config file');
        }
        if (!config.remote.builds.port) {
            throw new Error('FTP build upload error: missing "remote.builds.port" value in config file');
        }
        if (!config.remote.builds.user) {
            throw new Error('FTP build upload error: missing "remote.builds.user" value in config file');
        }
        if (!config.remote.builds.password) {
            throw new Error('FTP build upload error: missing "remote.builds.password" value in config file');
        }
        const cordovaTasks = require('./cordova').TASKS;
        if (config.tasks.contains(cordovaTasks.BUILD_IOS) || config.tasks.contains(cordovaTasks.BUILD_ANDROID)) {
            this.verifyRepoUpdate(config);
        }
        if (config.tasks.contains(cordovaTasks.BUILD_IOS)) {
            if (!config.remote.builds.iosDestinationPath) {
                throw new Error('FTP+iOS upload error: missing "remote.builds.iosDestinationPath" value in config file');
            }
        }
        if (config.tasks.contains(cordovaTasks.BUILD_ANDROID)) {
            if (!config.remote.builds.androidDestinationPath) {
                throw new Error('FTP+Android upload error: missing "remote.builds.androidDestinationPath" value in config file');
            }
        }
    },

    verifyUploadSourcesSteps(config) {
        if (!config.remote.sources.host) {
            throw new Error('FTP sources upload error: missing "remote.sources.hosts" value in config file');
        }
        if (!config.remote.sources.user) {
            throw new Error('FTP sources upload error: missing "remote.sources.user" value in config file');
        }
        if (!config.remote.sources.password) {
            throw new Error('FTP sources upload error: missing "remote.sources.password" value in config file');
        }
        if (!config.remote.sources.destinationPath) {
            throw new Error('FTP sources upload error: missing "remote.sources.destinationPath" value in config file');
        }
    },

    verifyRepoUpdate(config) {
        if (!config.remote.repo.host) {
            throw new Error('Repo update error: missing "remote.repo.hosts" value in config file');
        }
        if (!config.remote.repo.port) {
            throw new Error('Repo update error: missing "remote.repo.port" value in config file');
        }
        if (!config.remote.repo.user) {
            throw new Error('Repo update error: missing "remote.repo.user" value in config file');
        }
        if (!config.remote.repo.password) {
            throw new Error('Repo update error: missing "remote.repo.password" value in config file');
        }
        if (!config.remote.repo.jsonPath) {
            throw new Error('Repo update error: missing "remote.repo.jsonPath" value in config file');
        }
        if (!config.remote.repo.homepageUrl) {
            throw new Error('Repo update error: missing "remote.repo.homepageUrl" value in config file');
        }
    }
};

module.exports = Remote;
