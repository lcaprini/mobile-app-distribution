#!/usr/bin/env node
'use strict';

require('../protos');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const logger = require('../logger');
const utils = require('../utils');
const cordova = require('../cordova').CORDOVA;
const workingDir = path.join(process.cwd(), './wd');

console.log('This utility will walk you through creating a distribute.json file.');
console.log('It only covers the most common items, and tries to guess sensible defaults\n');

console.log('See https://github.com/lcaprini/mobile-app-distribution for definitive documentation on these fields and exactly what they do.\n');

console.log('Press ^C at any time to quit\n');

const init = () => {
    const DISTRIBUTE = {
        CORDOVA : 'Cordova',
        IOS     : 'iOS',
        ANDROID : 'Android'
    };

    let appName = utils.findAppName();

    inquirer.prompt([{
        type    : 'input',
        name    : 'name',
        message : 'app.name',
        default : appName
    }, {
        type    : 'input',
        name    : 'label',
        message : 'app.label',
        default : appName
    }, {
        type    : 'list',
        name    : 'distribute',
        message : 'Which distribute system you want initilize?',
        choices : [
            DISTRIBUTE.CORDOVA,
            DISTRIBUTE.IOS,
            DISTRIBUTE.ANDROID
        ]}
    ]).then(({name, label, distribute}) => {
        let config = {
            app : {
                name  : name,
                label : label
            }
        };
        if (distribute === DISTRIBUTE.CORDOVA) {
            cordova.init(config).then(
                config => {
                    fs.writeFileSync(path.join(workingDir, './distribute.json'), JSON.stringify(config, null, 4));
                    logger.section('distribute.json created');
                    process.exit(0);
                }
            );
        }
        else {
            logger.info('Coming soon...');
            process.exit(0);
        }
    });
};

if (fs.existsSync(path.join(workingDir, './distribute.json'))) {
    utils.prompt('A distribute.json file already exists and this tool will overwrite it. Do you want to continue? (y/N)').then(
        result => {
            if (result.toLowerCase() === 'y') {
                init();
            }
            else {
                process.exit(0);
            }
        }
    );
}
else {
    init();
}
