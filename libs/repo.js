'use strict';

const _ = require('lodash');
const moment = require('moment');
const prompt = require('prompt');
const JSFtp = require("jsftp");
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const utils = require('./utils');
const Repo = {

    UPDATING : Promise.resolve(),

    isUpdatingRepo(){
        return (this.UPDATING.isPending());
    },

    update({repoPath, server, version, hidden, changelog, androidBuildPath = null, iosBuildPath = null, rootPath}){

        function update(){
            Repo.UPDATING = new Promise((resolve, reject) => {

                utils.downloadFile({file : repoPath, server}).then(
                    data => {
                        let jsonFile = JSON.parse(data);
                        let build = _.remove(jsonFile.builds, b => {return b.version == version})[0];
                        if(!build){
                            build = {
                                version,
                                hidden
                            }
                        }
                        build.changelog = changelog;
                        build.date = moment().format('DD/MM/YYYY HH:mm:ss');
                        if(androidBuildPath){
                            build.androidBuildPath = androidBuildPath;
                        }
                        if(iosBuildPath){
                            build.iosBuildPath;
                        }
                        jsonFile.builds.unshift(build);
                        const tmpJsonFile = path.join(rootPath, `./.builds.json`);
                        fs.writeFileSync(tmpJsonFile, JSON.stringify(jsonFile, null, 4), {encoding: 'utf-8', flag: 'w'});
                        utils.uploadFile({
                            localFile : tmpJsonFile,
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
                        )
                    },
                    err => {
                        logger.error(err);
                    }
                )                
            });
        }

        // Wait previous update before run the new one
        if(this.isUpdatingRepo()){
            this.UPDATING.then(update);
        }
        else{
            update();
        }
    },

    verify(config){
        if(!config.remote.repo.host){
            throw new Error('Repo update error: missing "remote.repo.hosts" value in config file');
        }
        if(!config.remote.repo.port){
            throw new Error('Repo update error: missing "remote.repo.port" value in config file');
        }
        if(!config.remote.repo.user){
            throw new Error('Repo update error: missing "remote.repo.user" value in config file');
        }
        if(!config.remote.repo.password){
            throw new Error('Repo update error: missing "remote.repo.password" value in config file');
        }
        if(!config.remote.repo.jsonPath){
            throw new Error('Repo update error: missing "remote.repo.jsonPath" value in config file');
        }
        if(!config.remote.repo.homepageUrl){
            throw new Error('Repo update error: missing "remote.repo.homepageUrl" value in config file');
        }
    }
}

module.exports = Repo;