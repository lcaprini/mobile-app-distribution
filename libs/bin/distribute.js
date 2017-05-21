#!/usr/bin/env node
'use strict';

const program = require('commander');

const logger = require('../libs/logger');
const config = require('../libs/config');

program
  // .version(pkg.version)
  .allowUnknownOption()
  .option('-p, --config [config]', 'config file for app distribution', 'distribute.json')
  .option('-v, --app-version <version>', 'app version')
  .option('-l, --app-version-label [version]', 'app version label')
  .option('-a, --android-version-code [version code]', 'Android version code')
  .option('-i, --ios-bundle-version [bundle version]', 'iOS bundle version')
  .option('-c, --change-log [change-log.txt or "First edit***Other edit..."]', 'File path or list with "***" separator', 'No changelog')
  
  .parse(process.argv);

logger.debug(`program.config: ${program.config}`);
logger.debug(`program.appVersion: ${program.appVersion}`);
logger.debug(`program.appVersionLabel: ${program.appVersionLabel}`);
logger.debug(`program.androidVersionCode: ${program.androidVersionCode}`);
logger.debug(`program.iosBundleVersion: ${program.iosBundleVersion}`);
logger.debug(`program.changeLog: ${program.changeLog}`);