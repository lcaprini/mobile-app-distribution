'use strict';

const logger = require('./logger');

class Ios {

    calculateBundleVersion(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return `${versions[0]}.${versions[1]}.${versions[2]}`;
    }

    verify(config){
        if(!config.iosBundleId){
            throw new Error('iOS build error: missing "ios-bundle-id" value in config file');
        }
        if(!config.iosProvisioningProfile){
            throw new Error('iOS build error: missing "ios-provisioning-profile" value in config file');
        }
        if(!config.buildsDir){
            throw new Error('iOS build error: missing "builds-dir" value in config file');
        }
    }
}

module.exports = new Ios();