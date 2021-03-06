'use strict';
const fs = require('fs');
const path = require('path');
const plist = require('plist');
const shell = require('shelljs');
const inquirer = require('inquirer');

const logger = require('./logger');
const remote = require('./remote');

class Ios {
    calculateBundleVersion(appVersion) {
        let versions = appVersion.split('.');

        return `${versions[0]}.${versions[1]}.${versions[2]}`;
    }

    setDisplayName({ infoPlistPath, displayName }) {
        logger.section(`Set '${displayName}' as iOS Bundle Display Name in ${infoPlistPath}`);
        let parsedPlist = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
        parsedPlist.CFBundleDisplayName = displayName;
        let updatedPlist = plist.build(parsedPlist);
        fs.writeFileSync(infoPlistPath, updatedPlist);
    }

    archiveWorkspace({ projectPath, appName, schema, verbose }) {
        const xcodeWorkspaceFilePath = path.join(projectPath, `./${appName}.xcworkspace`);
        const xcarchiveFilePath = path.join(projectPath, `./${appName}.xcarchive`);
        logger.section(`Archive iOS Workspace into '${xcarchiveFilePath}'`);
        process.chdir(projectPath);
        const cmdXcodebuildArchive = `xcodebuild archive -workspace '${xcodeWorkspaceFilePath}' -scheme '${schema}' -archivePath '${xcarchiveFilePath}'`;
        let err = shell.exec(cmdXcodebuildArchive, { silent: !verbose }).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    }

    archiveProject({ projectPath, appName, schema, verbose }) {
        const xcodeprojFilePath = path.join(projectPath, `./${appName}.xcodeproj`);
        const xcarchiveFilePath = path.join(projectPath, `./${appName}.xcarchive`);
        logger.section(`Archive iOS Project into '${xcarchiveFilePath}'`);
        process.chdir(projectPath);
        const cmdXcodebuildArchive = `xcodebuild archive -project '${xcodeprojFilePath}' -scheme '${schema}' -archivePath '${xcarchiveFilePath}'`;
        let err = shell.exec(cmdXcodebuildArchive, { silent: !verbose }).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
    }

    createExportOptionsPlist({ exportOptionsPlistPath, exportOptionsPlist }) {
        logger.section(`Create/Update iOS exportOptionsPlist file in '${exportOptionsPlistPath}'`);
        fs.writeFileSync(exportOptionsPlistPath, plist.build(exportOptionsPlist));
    }

    exportIpa({ projectPath, appName, ipaFileName, exportOptionsPlist, exportOptionsPlistPath, exportDir, verbose }) {
        const xcarchiveFilePath = path.join(projectPath, `./${appName}.xcarchive`);
        if (!exportOptionsPlistPath) {
            exportOptionsPlistPath = path.join(projectPath, './exportOptions.plist');
            this.createExportOptionsPlist({
                exportOptionsPlistPath: exportOptionsPlistPath,
                exportOptionsPlist: exportOptionsPlist
            });
        }
        logger.section(`Export IPA from '${xcarchiveFilePath}' into ${exportDir} directory`);
        process.chdir(projectPath);
        const cmdXcodebuildExport = `xcodebuild -exportArchive -archivePath '${xcarchiveFilePath}' -exportPath '${exportDir}' -exportOptionsPlist '${exportOptionsPlistPath}'`;
        let err = shell.exec(cmdXcodebuildExport, { silent: !verbose }).stderr;
        if (shell.error()) {
            // shelljs has already printed error,
            // so I print it only if verbose mode is OFF
            if (!verbose) {
                logger.error(err);
            }
            process.exit(1);
        }
        const exportedIpaPath = path.join(exportDir, `./${appName}.ipa`);
        const exportedIpaPathWithLabel = path.join(exportDir, `./${ipaFileName}`);
        fs.renameSync(exportedIpaPath, exportedIpaPathWithLabel);
    }

    createManifest({ id, version, ipaUrlPath, manifestPath, appName, schema, exportDir }) {
        logger.section(`Create iOS manifest for OTA install in '${exportDir}'`);
        const manifest = {
            items: [{
                assets: [{
                    kind: 'software-package',
                    url: ipaUrlPath
                }],
                CFBundleURLTypes: [{
                    CFBundleURLSchemes: [schema]
                }],
                metadata: {
                    'bundle-identifier': id,
                    'bundle-version': version,
                    kind: 'software',
                    title: appName
                }
            }]
        };
        let manifestPlist = plist.build(manifest);
        fs.writeFileSync(manifestPath, manifestPlist);
    }

    uploadManifest({ manifestFilePath, server, destinationPath }) {
        const remoteFile = path.join(destinationPath, path.basename(manifestFilePath));
        logger.section(`Upload iOS Manifest on ${remoteFile}`);
        return remote.uploadFile({
            localFile: manifestFilePath,
            server: server,
            remoteFile: remoteFile
        });
    }

    uploadIPA({ ipaFilePath, server, destinationPath }) {
        const remoteFile = path.join(destinationPath, path.basename(ipaFilePath));
        logger.section(`Upload iOS IPA on ${remoteFile}`);
        return remote.uploadFile({
            localFile: ipaFilePath,
            server: server,
            remoteFile: remoteFile
        });
    }

    uploadManifestAndIPA({ ipaFilePath, manifestFilePath, server, destinationPath }) {
        return this.uploadIPA({
            ipaFilePath,
            server,
            destinationPath
        }).then(() => {
            return this.uploadManifest({
                manifestFilePath,
                server,
                destinationPath
            });
        });
    }

    verify(config) {
        const iosProjectPath = path.join(config.cordova.path, './platforms/ios');
        if (!fs.existsSync(iosProjectPath)) {
            throw new Error(`iOS build error: no iOS project in "${iosProjectPath}" directory`);
        }
        if (config.ios.infoPlistPath) {
            if (!fs.existsSync(config.ios.infoPlistPath)) {
                throw new Error(`iOS build error: missing plist file in "${config.ios.infoPlistPath}"`);
            }
        }
        else {
            const plistPath1 = path.join(iosProjectPath, config.app.name, './Info.plist');
            if (!fs.existsSync(plistPath1)) {
                let plistPath2 = path.join(iosProjectPath, config.app.name, `./${config.app.name}-Info.plist`);
                if (!fs.existsSync(plistPath2)) {
                    throw new Error(`iOS build error: missing plist file at "${plistPath1}" and "${plistPath2}". Please specify with "ios-info-plist-path" in config file`);
                }
                else {
                    config.ios.infoPlistPath = plistPath2;
                }
            }
            else {
                config.ios.infoPlistPath = plistPath1;
            }
        }
        if (!config.ios.bundleId) {
            throw new Error('iOS build error: missing "ios.bundleId" value in config file');
        }
        if (!config.buildsDir) {
            throw new Error('iOS build error: missing "builds-dir" value in config file');
        }
    }

    initializeBuild(config) {
        return inquirer.prompt([{
            type: 'input',
            name: 'bundleId',
            message: 'ios.bundleId',
            default: 'it.lcaprini.test',
            validate(input) {
                const pattern = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i;
                return pattern.test(input);
            }
        }, {
            type: 'input',
            name: 'exportOptionsPlistMethod',
            message: 'ios.exportOptionsPlist.method',
            default: 'enterprise',
            validate(input) {
                const methodsAllowed = [
                    'app-store',
                    'package',
                    'ad-hoc',
                    'enterprise',
                    'development',
                    'developer-id'];

                return methodsAllowed.contains(input);
            }
        }, {
            type: 'input',
            name: 'exportOptionsPlistTeamID',
            message: 'ios.exportOptionsPlist.teamID',
            default: 'ABC123DEF'
        }]).then(({ bundleId, exportOptionsPlistMethod, exportOptionsPlistTeamID }) => {
            if (!config.ios) {
                config.ios = {};
            }
            config.ios.bundleId = bundleId;
            config.ios.exportOptionsPlist = {
                method: exportOptionsPlistMethod,
                teamID: exportOptionsPlistTeamID
            };
            return config;
        });
    }
}

module.exports = new Ios();
