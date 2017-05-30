#!/usr/bin/env node
'use strict';

require('../protos');
const program = require('commander');

program
  .version('1.0.0')
  .command('init', 'initialize distribution')
  .command('build <version>', 'build new version')
  .parse(process.argv);