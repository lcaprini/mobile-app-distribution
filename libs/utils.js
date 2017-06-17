'use strict';

const prompt = require('prompt');
const shell = require('shelljs');
const JSFtp = require("jsftp");
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const Utils = {

    uploading : false,

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

    uploadFile({localFile, server, remotePath}){

        function upload(){
            Utils.uploading = new Promise((resolve, reject) => {
                let ftp = new JSFtp(server);
                let counter = 0;
                // ftp.on('progress', data => {
                //     console.log("uploading...", ++counter);
                // });
                const remoteFile = path.join(remotePath, path.basename(localFile));
                ftp.put(localFile, remoteFile, function(hadError) {
                if (!hadError)
                    console.log("Upload completed!");
                    ftp.destroy();
                    resolve();
                });
            });
        }

        // Only one upload at time is allowed
        if(this.uploading && this.uploading.isPending()){
            this.uploading.then(upload);
        }
        else{
            upload();
        }
    }
}

module.exports = Utils;