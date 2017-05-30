
const logger = require('./logger');

class Android {

    calculateVersionCode(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return parseInt(versions[2]) + (parseInt(versions[1]) * 100) + (parseInt(versions[0]) * 10000);
    }
}

module.exports = new Android();