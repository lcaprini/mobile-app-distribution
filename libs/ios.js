
const logger = require('./logger');
const config = require('./config');

class Ios {

    constructor() {}

    calculateBundleVersion() {
        let version = [];
        let tempVersions = config.appVersion.split(".");

        for(let i = 0; i < version.length; i++){
            version[i] = (tempVersions[i]) ? tempVersions[i] : 0;
        }

        config.iosBundleVersion = `$(versions[0]).$(versions[1]).$(versions[2])`;
    }
}

module.exports = new Ios();