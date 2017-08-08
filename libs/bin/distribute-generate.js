#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const splashiconGenerator = require('splashicon-generator');

const TASKS = require('../cordova').TASKS;

const iosIcons = {
    name: 'ios',
    isAdded: true,
    iconsPath: 'resources/icons/ios/',
    icons: [
        { name: "../../../icon.png", size: 57 },
        { name: 'icon-57.png', size: 57 },
        { name: 'icon-60.png', size: 60 },
        { name: 'icon-60-2x.png', size: 120 },
        { name: 'icon-60-3x.png', size: 180 },
        { name: 'icon-76.png', size: 76 },
        { name: 'icon-76-2x.png', size: 152 },
        { name: 'icon-40.png', size: 40 },
        { name: 'icon-40-2x.png', size: 80 },
        { name: 'icon-40-3x.png', size: 120 },
        { name: 'icon-57-2x.png', size: 114 },
        { name: 'icon-72.png', size: 72 },
        { name: 'icon-72-2x.png', size: 144 },
        { name: 'icon-small.png', size: 29 },
        { name: 'icon-small-2x.png', size: 58 },
        { name: 'icon-small-3x.png', size: 87 },
        { name: 'icon-50.png', size: 50 },
        { name: 'icon-50-2x.png', size: 100 },
        { name: 'icon-83.5-2x.png', size: 167 }
    ]
}

const options = {
    ICON_FILE : '',
    SPLASH_FILE : '',
    ICON_PLATFORMS : []
};
const logger = require('../logger');
const utils = require('../utils');

program
    .allowUnknownOption()
    .usage(`-i <icon-path> [options]`)
    .option('-i, --icon <icon-path>', 'icon path to crop and resize')
    .option(`-p, --platforms <[${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID}]>`, 'platforms to create icons or splash')
    // .option('-s, --splash <splash-path>', 'splash path to crop and resize')
    .parse(process.argv);

console.log('This utility will create all icons for requested platforms.\n');
console.log('Press ^C at any time to quit.\n');

if(program.icon){
    options.ICON_FILE = path.isAbsolute(program.icon) ? program.icon : path.join(process.cwd(), program.icon);
    if(program.platforms){
        program.platforms = program.platforms.split(',');
    }
    else{
        program.platforms = [
            TASKS.BUILD_IOS,
            TASKS.BUILD_ANDROID
        ];
    }
    if(program.platforms.contains(TASKS.BUILD_IOS)){
        const Contents = JSON.parse(fs.readFileSync(path.join(__dirname, '../../resources/Contents.json')));
        let iosPlatform = {
            name: 'ios',
            isAdded: true,
            iconsPath: 'resources/ios/icons/',
            icons : []
        }
        _.each(Contents.images, icon => {
            iosPlatform.icons.push({
                name: icon.filename,
                size: parseInt(icon.size.split('x')[0]) * parseInt(icon.scale)
            });
        });
        options.ICON_PLATFORMS.push(iosPlatform);
        // gm(srcPath)
        //     .quality(1)
        //     .resize(icon.size, icon.size)
        //     .setFormat(icon.name.replace(/.*\.(\w+)$/i, '$1').toLowerCase())
        //     .write(filePath, function(err){
        //         if (err) {
        //             deferred.reject(err);
        //         }
        //         else{
        //             deferred.resolve();
        //             display.success(icon.name + ' created');
        //         }
        //     })
        splashiconGenerator.generate(options).then(
            () => {
                logger.section('iOS images generated');
                process.exit(0);
            },
            err => {
                logger.error(err);
                process.exit(1);
            });
    }
}
// if(program.splash){
//     options.SPLASH_FILE = path.isAbsolute(program.splash) ? program.splash : path.join(process.cwd(), program.splash);
// }

