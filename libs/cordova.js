
const shell = require('shelljs');
const path = require('path');
const logger = require('./logger');

const tasks = {
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

    exec(){
        const config = require('./config');

        if(config.tasks.contains(tasks.COMPILE_SOURCES)){
            this.compileSource();
            logger.debug('compile ends');
        }
    }

    compileSource(){
        const config = require('./config');

        // Save actual dir to back into when process ends
        const actualDir = process.cwd();
        // Calc working dir for campile task and navigate into
        const workingDir = path.join(config.rootPath, config.compileSourcesPath);
        try{
            process.chdir(workingDir);
            logger.section(`Compile source:\n$ ${config.compileSourcesCmd}`);
            shell.exec(config.compileSourcesCmd, {silent: !config.verbose});
        }
        catch(e){
            logger.error(e);
        }
    }

    build() {
        const config = require('./config');
        
        let v1 = shell.exec('node --version', {silent:true}).stdout;
        logger.debug(v1);
        let err = shell.exec('noaasdde --version', {silent:true}).stderr;
        logger.debug(err);
        if(shell.error()){
            logger.debug(shell.error());
        }
        process.chdir(config.rootPath)
        console.log('New directory: ' + process.cwd());
        // shell.exec('npm install', function(code, stdout, stderr) {
        //     console.log('Exit code:', code);
        //     console.log('Program output:', stdout);
        //     console.log('Program stderr:', stderr);
        // });

        var child = shell.exec('npasdm inita', {async:true, silent:true});
        child.stdout.on('data', function(data) {
            console.log(data);
        });
        child.stderr.on('data', function(data){
            console.log('err', data);
        });
        child.stdout.on('end', function(data) {
            console.log('end--', data);
        });
        child.stderr.on('end', function(data){
            console.log('end--', 'err', data);
        });
    }
}

module.exports = {
    cordova : new Cordova(),
    tasks : tasks
}