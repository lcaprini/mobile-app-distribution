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

    setDisplayName({iosInfoPlistPath, displayName}){
        logger.section(`Set '${displayName}' as iOS Bundle Display Name in ${iosInfoPlistPath}`);
        let parsedPlist = plist.parse(fs.readFileSync(iosInfoPlistPath, 'utf8'));
        parsedPlist.CFBundleDisplayName = displayName;
        let updatedPlist = plist.build(parsedPlist);
        fs.writeFileSync(iosInfoPlistPath, updatedPlist);
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
        const iosProjectPath = path.join(config.cordovaPath, './platforms/ios');
        if(!fs.existsSync(iosProjectPath)){
            throw new Error(`iOS build error: no iOS project in "${iosProjectPath}" directory`);
        }
        if(config.iosInfoPlistPath){
            if(!fs.existsSync(config.iosInfoPlistPath)){
                throw new Error(`iOS build error: missing plist file in "${config.iosInfoPlistPath}"`);
            }
        }
        else{
            const plistPath_1 = path.join(iosProjectPath, config.appName, './Info.plist');
            if(!fs.existsSync(plistPath_1)){
                let plistPath_2 = path.join(iosProjectPath, config.appName, `./${config.appName}-Info.plist`);
                if(!fs.existsSync(plistPath_2)){
                    throw new Error(`iOS build error: missing plist file at "${plistPath_1}" and "${plistPath_2}". Please specify with "ios-info-plist-path" in config file`);
                }
            else{
                config.iosInfoPlistPath = plistPath_2;
            }
            }
            else{
                config.iosInfoPlistPath = plistPath_1;
            }
        }
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