
const asciimo = require('asciimo').Figlet;
const prompt = require('prompt');
const Promise = require('bluebird');

const logger = require('./logger');
const config = require('./config');

class Utils {

    prompt(text){
        const utils = this;
        return new Promise(function (resolve, reject) {
            prompt.start();
            prompt.get([text], function (err, result) {
                if (err) { reject(); }
                resolve(result[text].toLowerCase());
            });
        });
    }

    printRecap() {
        const utils = this;
        return new Promise(function (resolve, reject) {
            asciimo.write(config.appName, 'Ogre', function(art){
                logger.info(art);
                logger.info('####################################################################');
                logger.info('  App name:\t\t\t',                   config.appName);
                logger.info('  App label:\t\t\t',                  config.appLabel);
                logger.info('  App version:\t\t\t',                config.appVersion);
                logger.info('  App version label:\t\t',            config.appVersionLabel);
                if(config.tasks.indexOf('i') > -1){
                    logger.info('  iOS bundle id:\t\t',            config.iosBundleId);
                    logger.info('  iOS provisioning profile:\t',   config.iosProvisioningProfile);
                    logger.info('  iOS bundle version:\t\t',       config.iosBundleVersion);
                }
                if(config.tasks.indexOf('a') > -1){
                    logger.info('  Android bundle id:\t\t',        config.androidBundleId);
                    logger.info('  Android version code:\t\t',     config.androidVersionCode);
                }
                logger.info('####################################################################');

                const validateRecap = () => {
                    utils.prompt('Press \'y\' to continue the build process, \'n\' to stop it').then(
                        result => {
                            if(result == 'y'){
                                resolve();
                            }
                            else if(result == 'n'){
                                logger.info('\n\nExit process...\n\n');
                                process.exit(0);
                            }
                            else{
                                validateRecap();
                            }
                        },
                        err => {
                            logger.error(err);
                            process.exit(1);
                        }
                    )
                }
                validateRecap();
                
            });
        });
    }
}

module.exports = new Utils();