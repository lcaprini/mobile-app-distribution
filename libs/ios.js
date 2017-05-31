'use strict';

const logger = require('./logger');

class Ios {

    calculateBundleVersion(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return `${versions[0]}.${versions[1]}.${versions[2]}`;
    }
}

module.exports = new Ios();