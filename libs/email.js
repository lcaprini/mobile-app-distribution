'use strict';

const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const inquirer = require('inquirer');

const Email = {

    SENDING_EMAIL: Promise.resolve(),

    sendEmail({from, to, server, appName, appVersion, body}) {
        const logger = require('./logger');
        logger.section('Send email to working group');

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: server.host,
            port: server.port,
            secure: false,
            tls: { rejectUnauthorized: false },
            auth: {
                user: server.user,
                pass: server.password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: `Mobile App Distribution <${from}>`,
            to: to,
            subject: `${appName} v.${appVersion} is ready`,
            html: body
        };

        // send mail with defined transport object
        Email.SENDING_EMAIL = new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    throw err;
                }
                resolve();
            });
        });
    },

    verify(config) {
        if (!config.email.host) {
            throw new Error('Send email error: missing "email.host" value in config file');
        }
        if (!config.email.port) {
            throw new Error('Send email error: missing "email.port" value in config file');
        }
        if (!config.email.user) {
            throw new Error('Send email error: missing "email.user" value in config file');
        }
        if (!config.email.password) {
            throw new Error('Send email error: missing "email.password" value in config file');
        }
        if (!config.email.from) {
            throw new Error('Send email error: missing "email.from" value in config file');
        }
        if (!config.email.to) {
            throw new Error('Send email error: missing "email.to" value in config file');
        }
    },

    initializeSend(config) {
        return inquirer.prompt([{
            type: 'input',
            name: 'host',
            message: 'email.host',
            default: 'mail.gmail.com'
        }, {
            type: 'input',
            name: 'user',
            message: 'email.user',
            default: 'lcaprini-user'
        }, {
            type: 'input',
            name: 'password',
            message: 'email.password',
            default: 'lcaprini-password'
        }, {
            type: 'input',
            name: 'from',
            message: 'email.from',
            default: 'luca.caprini@gmail.com'
        }, {
            type: 'input',
            name: 'to',
            message: 'email.to',
            default: 'lcap@gmail.com, capr_l@gmail.com'
        }]).then(({host, user, password, from, to}) => {
            if (!config.email) {
                config.email = {};
            }
            config.email.host = host;
            config.email.user = user;
            config.email.password = password;
            config.email.from = from;
            config.email.to = to.replace(/ /g, '').split(',');
            return config;
        });
    }
};

module.exports = Email;
