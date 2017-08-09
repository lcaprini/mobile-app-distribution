#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json')));

program
    .version(packageJson.version)
    .command('init', 'initializes distribution')
    .command('resources', 'generates icons and splashes for iOS and Android platforms')
    .command('wd', 'creates wireless distribution folder')
    .command('cordova <version>', 'builds new version of a Cordova app')
    .parse(process.argv);
