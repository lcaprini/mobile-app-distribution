#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const cordovaRes = require('cordova-res');
const fs = require('fs');
const path = require('path');

const logger = require('../logger');

const PLATFORMS = {
    IOS: 'i',
    ANDROID: 'a'
};

const getIcon = iconPath => {
    const iconFullPath = path.isAbsolute(iconPath) ? iconPath : path.join(process.cwd(), iconPath);

    if (!fs.existsSync(iconFullPath)) {
        logger.error(`No icon image at ${iconFullPath}`);
        process.exit(1);
    }

    return iconFullPath;
};

const getSplash = splashPath => {
    const splashFullPath = path.isAbsolute(splashPath) ? splashPath : path.join(process.cwd(), splashPath);

    if (!fs.existsSync(splashFullPath)) {
        logger.error(`No splash image at ${splashFullPath}`);
        process.exit(1);
    }

    return splashFullPath;
};

(async function() {
    console.log('This utility will create all icons for requested platforms using cordova-res (https://github.com/ionic-team/cordova-res).\n');
    console.log('Press ^C at any time to quit.\n');

    program
        .allowUnknownOption()
        .usage('[options]')
        .option('-i, --icon <icon-path>', 'icon path to crop and resize')
        .option('-s, --splash <splash-path>', 'splash path to crop and resize')
        .option(`-p, --platforms <[${PLATFORMS.IOS}${PLATFORMS.ANDROID}]>`, 'platforms to create icons and/or splash')
        .option('-r, --resources-directory <resources-directory>', 'directory that contains the source images and the generated ones')
        .parse(process.argv);

    if (program.platforms) {
        program.platforms = program.platforms.split('');
    }
    else {
        program.platforms = [
            PLATFORMS.IOS,
            PLATFORMS.ANDROID
        ];
    }

    if (!program.resourcesDirectory) {
        program.resourcesDirectory = 'resources';
    }

    // If no icon and splash are spicified use the default ones
    // Else use only the specified items
    if (!program.icon && !program.splash) {
        if (!program.icon) {
            program.icon = `${program.resourcesDirectory}/icon.png`;
        }

        if (!program.splash) {
            program.splash = `${program.resourcesDirectory}/splash.png`;
        }
    }

    // Init options for cordova-res command
    let cordovaResOptions = {
        skipConfig: true,
        logstream: process.stdout,
        platforms: {},
        resourcesDirectory: program.resourcesDirectory
    };

    // Set iOS icon and splash info
    if (program.platforms.contains(PLATFORMS.IOS)) {
        cordovaResOptions.platforms.ios = {};

        if (program.icon) {
            cordovaResOptions.platforms.ios.icon = {
                sources: [getIcon(program.icon)]
            };
        }

        if (program.splash) {
            cordovaResOptions.platforms.ios.splash = {
                sources: [getSplash(program.splash)]
            };
        }
    }

    // Set Android icon and splash info
    if (program.platforms.contains(PLATFORMS.ANDROID)) {
        cordovaResOptions.platforms.android = {};

        if (program.icon) {
            cordovaResOptions.platforms.android.icon = {
                sources: [getIcon(program.icon)]
            };
        }

        if (program.splash) {
            cordovaResOptions.platforms.android.splash = {
                sources: [getSplash(program.splash)]
            };
        }
    }

    cordovaRes.run(cordovaResOptions).then(
        () => {
            process.exit(0);
        },
        err => {
            logger.error(err.messages);
            process.exit(1);
        });
})();
