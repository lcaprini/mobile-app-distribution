
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const Config = require('cordova-config');
const logger = require('./logger');
const utils = require('./utils');

const TASKS = {
    CHANGE_VERSION : 'v',
    COMPILE_SOURCES : 'c',
    BUILD_IOS : 'i',
    BUILD_ANDROID : 'a',
    UPLOAD_BUILDS : 'f',
    UPDATE_REPO : 'j',
    UPLOAD_SOURCES : 'z',
    SEND_EMAIL : 'e'
}

class Cordova {

    init({
        tasks,
        rootPath,
        compileSourcesPath,
        compileSourcesCmd,
        cordovaRootPath,
        appVersion,
        // appVersionLabel,
        // androidVersionCode,
        // iosBundleVersion,
        verbose
    }){
        this.tasks = tasks;
        this.rootPath = rootPath;
        this.compileSourcesPath = compileSourcesPath;
        this.compileSourcesCmd = compileSourcesCmd;
        this.cordovaRootPath = cordovaRootPath;
        this.appVersion = appVersion;
        // this.appVersionLabel = appVersionLabel;
        // this.androidVersionCode = androidVersionCode;
        // this.iosBundleVersion = iosBundleVersion;
        this.verbose = verbose;

        this.sourcePath = path.isAbsolute(this.compileSourcesPath)? this.compileSourcesPath : path.join(this.rootPath, this.compileSourcesPath);
        this.cordovaPath = path.isAbsolute(this.cordovaRootPath)? this.cordovaRootPath : path.join(this.rootPath, this.cordovaRootPath);
        this.cordovaConfigPath = path.join(this.cordovaPath, './config.xml');

        this.verifyTaskFields();
    }

    /**
     * Verify all params for Cordova ditribution
     */
    verifyTaskFields(){
        // Check params for compile sources
        if(this.tasks.contains(TASKS.COMPILE_SOURCES)){
            
            if(!this.compileSourcesCmd){
                throw new Error('Source compile error: missing "compile-sources-cmd" value in config file');
            }

            if(!fs.existsSync(this.sourcePath)){
                throw new Error(`Source compile error: directory "compile-sources-path" doesn\'t exists at ${this.sourcePath}`);
            }

            if(!fs.existsSync(this.cordovaPath)){
                throw new Error(`Source compile error: directory "cordova-root-path" doesn\'t exists at ${this.cordovaPath}`);
            }

            if(!fs.existsSync(this.cordovaConfigPath)){
                throw new Error(`Source compile error: config.xml file doesn\'t exists in ${this.cordovaConfigPath}`);
            }
            
            if(!this.appVersion){
                throw new Error('Invalid build version format: please, see http://semver.org');
            }
        }
    }

    /**
     * Compile web app sources in cordova app using task manager like, grunt, gulp, webpack, ecc...
     */
    compileSource(){
        process.chdir(this.sourcePath);
        logger.section(`Compile source:\n$ ${this.compileSourcesCmd}`);
        shell.exec(this.compileSourcesCmd, {silent: !this.verbose});
    }

    /**
     * Set app version in config.xml
     */
    setVersion(){
        logger.section('Set version in config.xml');
        const config = new Config(this.cordovaConfigPath);
        config.setVersion(this.appVersion);
        config.writeSync();
    }

    /**
     * 
     */

    // build() {
    //     const config = require('./config');
        
    //     let v1 = shell.exec('node --version', {silent:true}).stdout;
    //     logger.debug(v1);
    //     let err = shell.exec('noaasdde --version', {silent:true}).stderr;
    //     logger.debug(err);
    //     if(shell.error()){
    //         logger.debug(shell.error());
    //     }
    //     process.chdir(config.rootPath)
    //     console.log('New directory: ' + process.cwd());
    //     // shell.exec('npm install', function(code, stdout, stderr) {
    //     //     console.log('Exit code:', code);
    //     //     console.log('Program output:', stdout);
    //     //     console.log('Program stderr:', stderr);
    //     // });

    //     var child = shell.exec('npasdm inita', {async:true, silent:true});
    //     child.stdout.on('data', function(data) {
    //         console.log(data);
    //     });
    //     child.stderr.on('data', function(data){
    //         console.log('err', data);
    //     });
    //     child.stdout.on('end', function(data) {
    //         console.log('end--', data);
    //     });
    //     child.stderr.on('end', function(data){
    //         console.log('end--', 'err', data);
    //     });
    // }
}

module.exports = {
    Cordova : Cordova,
    TASKS : TASKS
}