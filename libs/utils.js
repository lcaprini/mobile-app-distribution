'use strict';

const _ = require('lodash');
const moment = require('moment');
const prompt = require('prompt');
const shell = require('shelljs');
const JSFtp = require("jsftp");
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const Utils = {

    UPLOADING_BUILDS : Promise.resolve(),

    isUploadingBuilds(){
        return (this.UPLOADING_BUILDS.isPending());
    },

    prompt(text){
        const utils = this;
        return new Promise((resolve, reject) => {
            prompt.start();
            prompt.get([text], (err, result) => {
                if (err) { reject(); }
                resolve(result[text].toLowerCase());
            });
        });
    },

    createPath({workingPath = null, path}){
        if(workingPath){
            process.chdir(workingPath);
        }
        shell.mkdir('-p', path);
    },

    uploadFile({localFile, server, remoteFile}){
        const logger = require('./logger');

        function upload(){
            Utils.UPLOADING_BUILDS = new Promise((resolve, reject) => {
                let ftp = new JSFtp(server);
                // let counter = 0;
                // ftp.on('progress', data => {
                //     console.log("uploading...", ++counter);
                // });
                ftp.put(localFile, remoteFile, err => {
                    ftp.destroy();
                    if(err){
                        reject();
                        throw new Error(err);
                    }
                    resolve();
                });
            });
            return Utils.UPLOADING_BUILDS;
        }

        // Only one upload at time is allowed
        if(this.isUploadingBuilds()){
            return this.UPLOADING_BUILDS.then(upload);
        }
        else{
            return upload();
        }
    },

    downloadFile({file, server}){
        return new Promise((resolve, reject) => {
            let ftp = new JSFtp(server);
            ftp.get(file, (err, socket) => {
                if (err) {
                    reject();
                    throw new Error(err);
                }
                
                let builds = '';
                socket.on('data', chunk => builds += chunk.toString())
                socket.on('close', err => {
                    ftp.destroy();
                    if(err){
                        reject();
                        throw new Error(err);
                    }
                    resolve(builds);
                });
                socket.resume();
            });
        });
    },

    printQRCode(data){
        var qrcode = require('qrcode-terminal');
        qrcode.generate(data);
    }
}

module.exports = Utils;