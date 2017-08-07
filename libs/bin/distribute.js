#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json')));

program
    .version(packageJson.version)
    .command('init', 'initialize distribution')
    .command('wd', 'create wireless distribution folder')
    .command('cordova <version>', 'build new version of a Cordova app')
    .parse(process.argv);
