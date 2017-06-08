'use strict';

const prompt = require('prompt');
const shell = require('shelljs');

class Utils {

    prompt(text){
        const utils = this;
        return new Promise((resolve, reject) => {
            prompt.start();
            prompt.get([text], (err, result) => {
                if (err) { reject(); }
                resolve(result[text].toLowerCase());
            });
        });
    }

    createPath({workingPath = null, path}){
        if(workingPath){
            process.chdir(workingPath);
        }
        shell.mkdir('-p', path);
    }
}

module.exports = new Utils();