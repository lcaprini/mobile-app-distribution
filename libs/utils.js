'use strict';

const prompt = require('prompt');
const shell = require('shelljs');
const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');

const Utils = {

    prompt(text) {
        return new Promise((resolve, reject) => {
            prompt.start();
            prompt.get([text], (err, result) => {
                if (err) {
                    reject(new Error(err));
                }
                resolve(result[text]);
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
        let qrcode = require('qrcode-terminal');
        qrcode.generate(data, {small: true});
    },

    findAppName() {
        let appName;
        const packageJsonPath = path.join(process.cwd(), './package.json');
        if (fs.existsSync(packageJsonPath)) {
            let packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
            appName = packageJson.name;
        }
        if (!appName) {
            appName = path.basename(path.dirname(packageJsonPath));
        }
        return appName;
    },

    askAppName() {
        let appName = this.findAppName();
        return this.prompt(`Please, specify app name (${appName})`);
    },

    askQuestions(questions, config) {
        let utils = this;
        if (questions.length > 0) {
            let question = questions.shift();
            return question(config).then(
                config => {
                    return utils.askQuestions(questions, config);
                });
        }
        else {
            return config;
        }
    }
};

module.exports = Utils;
