'use strict';

const prompt = require('prompt');
const shell = require('shelljs');
const Promise = require('bluebird');

const Utils = {

    prompt(text) {
        return new Promise((resolve, reject) => {
            prompt.start();
            prompt.get([text], (err, result) => {
                if (err) {
                    reject(new Error(err));
                }
                resolve(result[text].toLowerCase());
            });
        });
    },

    createPath({workingPath = null, path}) {
        if (workingPath) {
            process.chdir(workingPath);
        }
        shell.mkdir('-p', path);
    },

    printQRCode(data) {
        var qrcode = require('qrcode-terminal');
        qrcode.generate(data);
    }
};

module.exports = Utils;
