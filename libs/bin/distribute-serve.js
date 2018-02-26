#!/usr/bin/env node
'use strict';

require('../protos');
const connect = require('connect');
const corser = require('corser');
const fs = require('fs');
const path = require('path');
const program = require('commander');
const serveStatic = require('serve-static');
const opener = require('opener');

const logger = require('../logger');

program
    .allowUnknownOption()
    .usage(`<www-root-path> [options]`)
    .option('-p, --port <port>', 'Specify HTTP port for the web server')
    .parse(process.argv);

let wwwRootPath = (program.args[0]) ? program.args[0] : '.';
wwwRootPath = (path.isAbsolute(wwwRootPath)) ? wwwRootPath : path.join(process.cwd(), wwwRootPath);

if (!fs.existsSync(wwwRootPath)) {
    logger.error(`No directory at ${wwwRootPath}`);
    process.exit(1);
}

let port = (program.port) ? parseInt(program.port) : 9001;

const startServer = () => {
    var app = connect();
    app.use(corser.create());
    app.use(serveStatic(wwwRootPath))
    app.listen(port, () => {
        opener(`http://127.0.0.1:${port}`);

        logger.section(`Server started at ${wwwRootPath} at http://localhost:${port}.\nPress ^C at any time to quit.`);
    })
    app.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            port++;
            startServer();
        };
    });
};

startServer();
