'use strict';

const _ = require('lodash');
const JSFtp = require('jsftp');
const FtpDeploy = require('ftp-deploy');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const Promise = require('bluebird');
const inquirer = require('inquirer');

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

    uploadArchivie({archiveFilePath, sourceSrcPath, server, sourceDestPath}) {
        return new Promise((resolve, reject) => {
            var output = fs.createWriteStream(archiveFilePath);
            var archive = archiver('zip', {
                zlib : { level : 9 }
            });

            output.on('close', function() {
                Remote.uploadFile({
                    localFile  : fs.readFileSync(archiveFilePath),
                    remoteFile : path.join(sourceDestPath, path.basename(archiveFilePath)),
                    server
                }).then(
                    () => {
                        fs.unlinkSync(archiveFilePath);
                        resolve();
                    },
                    err => {
                        reject(err);
                    }
                );
            });
            archive.on('error', function(err) {
                reject(err);
            });

            archive.pipe(output);

            archive.directory(sourceSrcPath, path.basename(sourceSrcPath));
            archive.finalize();
        });
    },

    updateRepo({repoPath, server, version, hidden, changelog, releaseDate, androidBuildPath = null, iosBuildPath = null, angularBuildPath = null, rootPath}) {
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
                    build.date = releaseDate;
                    if (androidBuildPath) {
                        build.androidBuildPath = androidBuildPath;
                    }
                    if (iosBuildPath) {
                        build.iosBuildPath = iosBuildPath;
                    }
                    if (angularBuildPath) {
                        build.angularBuildPath = angularBuildPath;
                    }
                    jsonFile.builds.unshift(build);
                    const tmpJsonFile = path.join(rootPath, `./.builds.json`);
                    fs.writeFileSync(tmpJsonFile, JSON.stringify(jsonFile, null, 4), {encoding : 'utf-8', flag : 'w'});
                    Remote.uploadFile({
                        localFile  : fs.readFileSync(tmpJsonFile),
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

    uploadSources({archiveFilePath, sourceSrcPath, server, sourceDestPath}) {
        return new Promise((resolve, reject) => {
            var output = fs.createWriteStream(archiveFilePath);
            var archive = archiver('zip', {
                zlib : { level : 9 }
            });

            output.on('close', function() {
                Remote.uploadFile({
                    localFile  : archiveFilePath,
                    remoteFile : sourceDestPath,
                    server
                }).then(
                    () => {
                        fs.unlinkSync(archiveFilePath);
                        resolve();
                    },
                    err => {
                        reject(err);
                    }
                );
            });
            archive.on('error', function(err) {
                reject(err);
            });

            archive.pipe(output);

            archive.directory(sourceSrcPath, 'app/www');
            archive.file(path.join(__dirname, '../resources/source-upload-readme.md'), { name : 'app/README.md' });

            archive.finalize();
        });
    },

    deploy({folderSourcePath, folderDestPath, server, verbose}) {
        return new FtpDeploy().deploy({
            user         : server.user,
            password     : server.pass,
            host         : server.host,
            port         : server.port,
            localRoot    : folderSourcePath,
            remoteRoot   : folderDestPath,
            include      : ['*', '**/*'],
            deleteRemote : false
        }).then(
            res => {
                verbose && logger.info(res);
            },
            err => {
                verbose && logger.error(err);
            }
        );
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
        const angularTasks = require('./angular').TASKS;
        if (config.tasks.contains(cordovaTasks.BUILD_IOS) ||
            config.tasks.contains(cordovaTasks.BUILD_ANDROID)
        ) {
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
        if (config.tasks.contains(angularTasks.DEPLOY_BUILD)) {
            if (!config.remote.builds.angularDestinationPath) {
                throw new Error('FTP+Angular upload error: missing "remote.builds.angularDestinationPath" value in config file');
            }
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
    },

    verifyUploadSourcesStep(config) {
        if (!config.remote.sources.host) {
            throw new Error('Sources update error: missing "remote.sources.hosts" value in config file');
        }
        if (!config.remote.sources.port) {
            throw new Error('Sources update error: missing "remote.sources.port" value in config file');
        }
        if (!config.remote.sources.user) {
            throw new Error('Sources update error: missing "remote.sources.user" value in config file');
        }
        if (!config.remote.sources.password) {
            throw new Error('Sources update error: missing "remote.sources.password" value in config file');
        }
        if (!config.remote.sources.sourcesPath) {
            throw new Error('Sources update error: missing "remote.sources.sourcesPath" value in config file');
        }
    },

    initializeBuildUpload(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'host',
            message : 'remote.builds.host',
            default : 'lcapriniftp'
        }, {
            type    : 'input',
            name    : 'user',
            message : 'remote.builds.user',
            default : 'lcaprini-user'
        }, {
            type    : 'input',
            name    : 'password',
            message : 'remote.builds.password',
            default : 'lcaprini-password'
        }]).then(({host, user, password}) => {
            if (!config.remote) {
                config.remote = {};
            }
            if (!config.remote.builds) {
                config.remote.builds = {};
            }
            config.remote.builds.host = host;
            config.remote.builds.user = user;
            config.remote.builds.password = password;
            return config;
        });
    },

    initializeAngularBuildUpload(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'angularDestinationPath',
            message : 'remote.builds.angularDestinationPath',
            default : '/var/www/html/test/builds/angular'
        }]).then(({angularDestinationPath}) => {
            config.remote.builds.angularDestinationPath = angularDestinationPath;
            return config;
        });
    },

    initializeIosBuildUpload(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'iosDestinationPath',
            message : 'remote.builds.iosDestinationPath',
            default : '/var/www/html/test/builds/iOS'
        }]).then(({iosDestinationPath}) => {
            config.remote.builds.iosDestinationPath = iosDestinationPath;
            return config;
        });
    },

    initializeAndroidBuildUpload(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'androidDestinationPath',
            message : 'remote.builds.androidDestinationPath',
            default : '/var/www/html/test/builds/Android'
        }]).then(({androidDestinationPath}) => {
            config.remote.builds.androidDestinationPath = androidDestinationPath;
            return config;
        });
    },

    initializeRepoUpdate(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'host',
            message : 'remote.repo.host',
            default : 'lcapriniftp'
        }, {
            type    : 'input',
            name    : 'user',
            message : 'remote.repo.user',
            default : 'lcaprini-user'
        }, {
            type    : 'input',
            name    : 'password',
            message : 'remote.repo.password',
            default : 'lcaprini-password'
        }, {
            type    : 'input',
            name    : 'jsonPath',
            message : 'remote.repo.jsonPath',
            default : '/var/www/html/test/wd'
        }, {
            type    : 'input',
            name    : 'homepageUrl',
            message : 'remote.repo.homepageUrl',
            default : 'https://lcaprini.com/test/wd'
        }]).then(({host, user, password, jsonPath, homepageUrl}) => {
            if (!config.remote) {
                config.remote = {};
            }
            if (!config.remote.repo) {
                config.remote.repo = {};
            }
            config.remote.repo.host = host;
            config.remote.repo.user = user;
            config.remote.repo.password = password;
            config.remote.repo.jsonPath = jsonPath;
            config.remote.repo.homepageUrl = homepageUrl;
            return config;
        });
    },

    initializeAngularRepoUpdate(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'angularUrlPath',
            message : 'remote.repo.angularUrlPath',
            default : 'https://mycert-server.lcaprini.com/angular'
        }, {
            type    : 'input',
            name    : 'buildsPath',
            message : 'remote.repo.buildsPath',
            default : '/var/www/html/angular/builds'
        }]).then(({angularUrlPath, buildsPath}) => {
            config.remote.repo.angularUrlPath = angularUrlPath;
            config.remote.repo.buildsPath = buildsPath;
            return config;
        });
    },

    initializeIosRepoUpdate(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'iosUrlPath',
            message : 'remote.repo.iosUrlPath',
            default : 'https://mycert-server.lcaprini.com/iOS'
        }]).then(({iosUrlPath}) => {
            config.remote.repo.iosUrlPath = iosUrlPath;
            return config;
        });
    },

    initializeAndroidRepoUpdate(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'androidUrlPath',
            message : 'remote.repo.androidUrlPath',
            default : 'https://mycert-server.lcaprini.com/Android'
        }]).then(({androidUrlPath}) => {
            config.remote.repo.androidUrlPath = androidUrlPath;
            return config;
        });
    },

    initializeSourcesUpload(config) {
        return inquirer.prompt([{
            type    : 'input',
            name    : 'host',
            message : 'remote.sources.host',
            default : 'lcapriniftp'
        }, {
            type    : 'input',
            name    : 'user',
            message : 'remote.sources.user',
            default : 'lcaprini-user'
        }, {
            type    : 'input',
            name    : 'password',
            message : 'remote.sources.password',
            default : 'lcaprini-password'
        }, {
            type    : 'input',
            name    : 'sourcesPath',
            message : 'remote.sources.sourcesPath',
            default : '/var/www/html/test/sources'
        }]).then(({host, user, password, sourcesPath}) => {
            if (!config.remote) {
                config.remote = {};
            }
            if (!config.remote.sources) {
                config.remote.sources = {};
            }
            config.remote.sources.host = host;
            config.remote.sources.user = user;
            config.remote.sources.password = password;
            config.remote.sources.sourcesPath = sourcesPath;
            return config;
        });
    }
};

module.exports = Remote;
