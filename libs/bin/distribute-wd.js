#!/usr/bin/env node
'use strict';

require('../protos');
const fs = require('fs');
const path = require('path');

const logger = require('../logger');
const utils = require('../utils');

// Get default app name
const packageJsonPath = path.join(process.cwd(), './package.json');
let appName;
if (fs.existsSync(packageJsonPath)) {
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    appName = packageJson.name;
}
if (!appName) {
    appName = path.basename(path.dirname(packageJsonPath));
}

const createWd = () => {
    fs.createReadStream(path.join(wdModuleDir, './index.html')).pipe(fs.createWriteStream(path.join(wdDir, 'index.html')));
    fs.createReadStream(path.join(wdModuleDir, './build.js')).pipe(fs.createWriteStream(path.join(wdDir, 'build.js')));
    const buildsJson = {
        appName : appName,
        builds  : []
    };
    fs.writeFileSync(path.join(wdDir, './builds.json'), JSON.stringify(buildsJson, null, 4), {encoding : 'utf-8', flag : 'w'});

    logger.section('wd folder created');
};

const wdModuleDir = './remote/wd';
const wdDir = path.join(process.cwd(), './wd');
if (fs.existsSync(wdDir)) {
    utils.prompt('wd folder already exists. Overwrite it and its content? (y/N)').then(
        result => {
            if (result === 'y') {
                createWd();
            }
        },
        err => {
            logger.error(err);
            process.exit(1);
        }
    );
}
else {
    fs.mkdirSync(wdDir);
    createWd();
}
