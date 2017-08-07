#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const path = require('path');

const logger = require('../logger');
const utils = require('../utils');

const wdModuleDir = path.join(__dirname, '../../remote/wd');
const workingDir = path.join(process.cwd(), './wd');

program
    .allowUnknownOption()
    .usage(``)
    .parse(process.argv);

console.log('This utility will create a new folder called \'wd\' with all repository file to manually upload in your FTP server.\n');
console.log('Press ^C at any time to quit.\n');

const createWd = ({create}) => {
    utils.askAppName().then(
        appName => {
            if(create){
                fs.mkdirSync(workingDir);
            }
            fs.createReadStream(path.join(wdModuleDir, './index.html')).pipe(fs.createWriteStream(path.join(workingDir, 'index.html')));
            fs.createReadStream(path.join(wdModuleDir, './build.js')).pipe(fs.createWriteStream(path.join(workingDir, 'build.js')));
            const buildsJson = {
                appName : appName,
                builds  : []
            };
            fs.writeFileSync(path.join(workingDir, './builds.json'), JSON.stringify(buildsJson, null, 4), {encoding : 'utf-8', flag : 'w'});

            logger.section('wd folder created');
        },
        err => {
            logger.error(err);
            process.exit(1);
        }
    );
};

if (fs.existsSync(workingDir)) {
    utils.prompt('wd folder already exists. Overwrite it and its content? (y/N)').then(
        result => {
            if (result.toLowerCase() === 'y') {
                createWd({create : false});
            }
        },
        err => {
            logger.error(err);
            process.exit(1);
        }
    );
}
else {
    createWd({create : true});
}
