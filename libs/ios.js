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

    cleanProject({projectPath, verbose}){
        logger.section(`Clean iOS Project in '${projectPath}'`);
        process.chdir(projectPath);
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

    archiveProject({projectPath, appName, schema, verbose}){
        const xcodeprojFilePath = path.join(projectPath, `./${appName}.xcodeproj`);
        const xcarchiveFilePath = path.join(projectPath, `./${appName}.xcarchive`);
        logger.section(`Archive iOS Project into '${xcarchiveFilePath}'`);
        process.chdir(projectPath);
        const cmdXcodebuildArchive = `xcodebuild archive -project '${xcodeprojFilePath}' -scheme '${schema}' -archivePath '${xcarchiveFilePath}'`;
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

    createExportOptionsPlist({exportOptionsPlistPath, exportOptionsPlist}){
        logger.section(`Create/Update iOS exportOptionsPlist file in '${exportOptionsPlistPath}'`);
        fs.writeFileSync(exportOptionsPlistPath, plist.build(exportOptionsPlist));
    }

    exportIpa({projectPath, appName, versionLabel, exportOptionsPlistPath, exportDir, verbose}){
        const xcarchiveFilePath = path.join(projectPath, `./${appName}.xcarchive`);
        logger.section(`Export IPA from '${xcarchiveFilePath}' into ${exportDir} directory`);
        process.chdir(projectPath);
        const cmdXcodebuildExport = `xcodebuild -exportArchive -archivePath '${xcarchiveFilePath}' -exportPath '${exportDir}' -exportOptionsPlist '${exportOptionsPlistPath}'`
        let err = shell.exec(cmdXcodebuildExport, {silent: !verbose}).stderr;
        if(shell.error()){
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if(!verbose){
                logger.error(err);
            }
            process.exit(1);
        }
        const exportedIpaPath = path.join(exportDir, `./${appName}.ipa`);
        const exportedIpaPathWithLabel = path.join(exportDir, `./${versionLabel}.ipa`);
        fs.renameSync(exportedIpaPath, exportedIpaPathWithLabel);
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
        if(!config.ios.exportOptionsPlistPath){
            config.ios.exportOptionsPlistPath = path.join(config.cordova.path, './platforms/ios/exportOptions.plist');
            this.createExportOptionsPlist({
                exportOptionsPlistPath : config.ios.exportOptionsPlistPath,
                exportOptionsPlist : config.ios.exportOptionsPlist
            });
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