#!/usr/bin/env node
'use strict';

require('../protos');
const inquirer = require("inquirer");
const fs = require('fs');
const path = require('path');

const logger = require('../logger');
const cordova = require('../cordova').CORDOVA;
const email = require('../email');

let config = {};

// Get default app name
const packageJsonPath = path.join(process.cwd(), './package.json');
let appName;
if(fs.existsSync(packageJsonPath)){
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    appName = packageJson.name;
}
if(!appName){
    appName = path.basename(path.dirname(packageJsonPath));
}

const DISTRIBUTE = {
    CORDOVA : 'Cordova',
    IOS : 'iOS',
    ANDROID : 'Android'
};

inquirer.prompt([{
    type: 'list',
    name: 'distribute',
    message: 'Which distribute system you want initilize?',
    choices: [
        DISTRIBUTE.CORDOVA,
        DISTRIBUTE.IOS,
        DISTRIBUTE.ANDROID
    ]
}]).then(answers => {
    
    if(answers.distribute === DISTRIBUTE.CORDOVA){

        inquirer.prompt([{
            type: 'input',
            name: 'appName',
            message: 'App name?',
            default: appName
        },{
            type: 'input',
            name: 'appLabel',
            message: 'App label?',
            default: appName
        }]).then(({appName, appLabel}) => {

            config.app = {
                name : appName,
                label : appLabel
            }

            const TASKS = {
                CHANGE_VERSION : 'Change app version in HTML',
                COMPILE_SOURCES : 'Compile web app sources',
                BUILD_IOS : 'Build Cordova iOS platform',
                BUILD_ANDROID : 'Build Cordova Android platform',
                UPLOAD_BUILDS : 'Upload builds',
                UPLOAD_SOURCES : 'Upload sources',
                SEND_EMAIL : 'Send email to working group'
            };

            inquirer.prompt([{
                type: 'checkbox',
                message: 'Which tasks you want configure?',
                name: 'tasks',
                choices: [
                    { name: TASKS.CHANGE_VERSION },
                    { name: TASKS.COMPILE_SOURCES },
                    { name: TASKS.BUILD_IOS },
                    { name: TASKS.BUILD_ANDROID },
                    { name: TASKS.UPLOAD_BUILDS },
                    { name: TASKS.UPLOAD_SOURCES },
                    { name: TASKS.SEND_EMAIL }
                ]}]).then(({tasks}) => {

                    let questions = [];
                    
                    if(tasks.contains(TASKS.COMPILE_SOURCES)){
                        config.sources = {};
                        questions.push(cordova.initializeSourceCompile);
                    }
                    
                    if(tasks.contains(TASKS.CHANGE_VERSION)){
                        if(!config.sources)
                            config.sources = {};
                        questions.push(cordova.initializeChangeVersion);
                    }

                    const askQuestions = (questions, config) => {
                        if(questions.length > 0){
                            let question = questions.pop();
                            return question(config).then(
                                config => {
                                    return askQuestions(questions, config);
                                }
                            );
                        }
                        else{
                            return config;
                        }
                    };
                    askQuestions(questions, config).then(
                        config => {
                            logger.info("END -> writing json file", config);
                            process.exit();
                        },
                        () => {
                            process.exit(1);
                        }
                    );

            });

        });
    }
    else{
        logger.info('Coming soon...');
        process.exit(0);
    }

});