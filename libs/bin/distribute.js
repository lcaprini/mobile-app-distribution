#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));

program
    .version(packageJson.version)
    .command('wd', 'create wireless distribution folder')
    .command('cordova <version>', 'build new version of a Cordova app')
    .parse(process.argv);
