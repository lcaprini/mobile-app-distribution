'use strict';
const fs = require('fs');
const path = require('path');
const plist = require('plist');
const shell = require('shelljs');

const logger = require('./logger');

class Ios {

    calculateBundleVersion(appVersion) {
        let version = [];
        let versions = appVersion.split(".");

        return `${versions[0]}.${versions[1]}.${versions[2]}`;
    }

    setDisplayName({infoPlistPath, displayName}){
        logger.section(`Set '${displayName}' as iOS Bundle Display Name in ${infoPlistPath}`);
        let parsedPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
        parsedPlist.CFBundleDisplayName = displayName;
        let updatedPlist = plist.build(parsedPlist);
        fs.writeFileSync(infoPlistPath, updatedPlist);
    }

    cleanProject({iosProjectPath, verbose}){
        logger.section(`Clean iOS Project in '${iosProjectPath}'`);
        process.chdir(iosProjectPath);
        const cmdXcodebuildClean = 'xcodebuild clean -configuration Release -alltargets';
        let err = shell.exec(cmdXcodebuildClean, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    }

    archiveProject({iosProjectPath, appName, verbose}){
        const projectPath = path.join(iosProjectPath, `./${appName}.xcodeproj`);
        const archivePath = path.join(iosProjectPath, `./${appName}.xarchive`);
        logger.section(`Archive iOS Project into '${archivePath}'`);
        process.chdir(iosProjectPath);
        const cmdXcodebuildArchive = `xcodebuild archive -project '${projectPath}' -scheme '${appName}' -archivePath '${archivePath}'`;
        let err = shell.exec(cmdXcodebuildArchive, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
    }

    verify(config){
        const iosProjectPath = path.join(config.cordova.path, './platforms/ios');
        if(!fs.existsSync(iosProjectPath)){
            throw new Error(`iOS build error: no iOS project in "${iosProjectPath}" directory`);
        }
        if(config.ios.infoPlistPath){
            if(!fs.existsSync(config.ios.infoPlistPath)){
                throw new Error(`iOS build error: missing plist file in "${config.ios.infoPlistPath}"`);
            }
        }
        else{
            const plistPath_1 = path.join(iosProjectPath, config.app.name, './Info.plist');
            if(!fs.existsSync(plistPath_1)){
                let plistPath_2 = path.join(iosProjectPath, config.app.name, `./${config.app.name}-Info.plist`);
                if(!fs.existsSync(plistPath_2)){
                    throw new Error(`iOS build error: missing plist file at "${plistPath_1}" and "${plistPath_2}". Please specify with "ios-info-plist-path" in config file`);
                }
            else{
                config.ios.infoPlistPath = plistPath_2;
            }
            }
            else{
                config.ios.infoPlistPath = plistPath_1;
            }
        }
        if(!config.ios.bundleId){
            throw new Error('iOS build error: missing "ios.bundleId" value in config file');
        }
        if(!config.buildsDir){
            throw new Error('iOS build error: missing "builds-dir" value in config file');
        }
    }
}

module.exports = new Ios();