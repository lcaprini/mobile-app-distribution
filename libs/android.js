
const logger = require('./logger');
const config = require('./config');

class Android {

    constructor() {}

    calculateVersionCode() {
        let version = [];
        let tempVersions = config.appVersion.split(".");

        for(let i = 0; i < version.length; i++){
            version[i] = (tempVersions[i]) ? tempVersions[i] : 0;
        }

        config.androidVersionCode = parseInt(versions[2]) + (parseInt(versions[1]) * 100) + (parseInt(versions[0]) * 10000);
    }
}

module.exports = new Android();