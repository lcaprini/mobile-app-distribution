#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const splashiconGenerator = require('splashicon-generator');
const commandExists = require('command-exists').sync;

const TASKS = require('../cordova').TASKS;
const logger = require('../logger');
const ios = require('../ios');
const android = require('../android');

console.log('This utility will create all icons for requested platforms using graphicsmagick (http://www.graphicsmagick.org).\n');
console.log('Press ^C at any time to quit.\n');

const options = {
    ICON_FILE        : '',
    ICON_PLATFORMS   : [],
    SPLASH_FILE      : '',
    SPLASH_PLATFORMS : []
};

program
    .allowUnknownOption()
    .usage(`[options]`)
    .option('-i, --icon <icon-path>', 'icon path to crop and resize')
    .option('-s, --splash <splash-path>', 'splash path to crop and resize')
    .option(`-p, --platforms <[${TASKS.BUILD_IOS},${TASKS.BUILD_ANDROID}]>`, 'platforms to create icons or splash')
    .parse(process.argv);

if (!commandExists('gm')) {
    console.error('No graphicsmagick found.\nPlease install graphicsmagick (http://www.graphicsmagick.org/download.html or via brew) and retry');
    process.exit(1);
}

if (program.platforms) {
    program.platforms = program.platforms.split(',');
}
else {
    program.platforms = [
        TASKS.BUILD_IOS,
        TASKS.BUILD_ANDROID
    ];
}

// If no icon and splash are spicified use the default ones
// Else use only the specified items
if (!program.icon && !program.splash) {
    if (!program.icon) {
        program.icon = 'resources/icon.png';
    }

    if (!program.splash) {
        program.splash = 'resources/splash.png';
    }
}

if (program.icon) {
    options.ICON_FILE = path.isAbsolute(program.icon) ? program.icon : path.join(process.cwd(), program.icon);

    if (!fs.existsSync(options.ICON_FILE)) {
        logger.error(`No icon file at ${options.ICON_FILE}`);
        process.exit(1);
    }

    if (program.platforms.contains(TASKS.BUILD_IOS)) {
        let iconsPath = path.join(path.dirname(options.ICON_FILE), './ios/AppIcon.appiconset/');
        options.ICON_PLATFORMS.push(ios.getIconsMap({
            name      : 'iOS',
            iconsPath : iconsPath
        }));
        ios.copyIconsContentsJson(iconsPath);
    }

    if (program.platforms.contains(TASKS.BUILD_ANDROID)) {
        options.ICON_PLATFORMS.push(android.getIconsMap({
            name      : 'Android',
            iconsPath : path.join(path.dirname(options.ICON_FILE), './android/res/')
        }));
    }
}

if (program.splash) {
    options.SPLASH_FILE = path.isAbsolute(program.splash) ? program.splash : path.join(process.cwd(), program.splash);

    if (!fs.existsSync(options.SPLASH_FILE)) {
        logger.error(`No splash file at ${options.SPLASH_FILE}`);
        process.exit(1);
    }

    if (program.platforms.contains(TASKS.BUILD_IOS)) {
        let splashesPath = path.join(path.dirname(options.SPLASH_FILE), './ios/LaunchImage.launchimage/');
        options.SPLASH_PLATFORMS.push(ios.getSplashesMap({
            name       : 'iOS',
            splashPath : splashesPath
        }));
        ios.copySplshesContentsJson(splashesPath);
    }

    if (program.platforms.contains(TASKS.BUILD_ANDROID)) {
        options.SPLASH_PLATFORMS.push(android.getSplashesMap({
            name       : 'Android',
            splashPath : path.join(path.dirname(options.SPLASH_FILE), './android/res/')
        }));
    }
}

splashiconGenerator.generate(options).then(
    () => {
        process.exit(0);
    },
    err => {
        logger.error(err.messages);
        process.exit(1);
    });
