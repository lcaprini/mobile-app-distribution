'use strict';

const Promise = require('bluebird');
const nodemailer = require('nodemailer');

const Email = {

    SENDING_EMAIL : Promise.resolve(),
    
    sendEmail({from, to, server, appName, appVersion, body}){
        const logger = require('./logger');
        logger.section(`Send email to working group`);

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
    }
}

module.exports = Email;