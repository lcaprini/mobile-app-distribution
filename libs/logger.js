const winston = require('winston');
const path = require('path');
const _ = require('lodash');

// Custom winston logger initialization
logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'debug',
            colorize: 'all',
            prettyPrint: true,
            showLevel: false,
            stderrLevels: ['error']
        })
    ]
});

logger.section = (text, level = 'info') => {
    logger[level]('\n####################################');
    _.each(text.split('\n'), log => {
        logger[level](`# ${log}`);
    });
    logger[level]('####################################\n');
}

logger.setErrorLog = rootPath => {
    logger.add(winston.transports.File,{
        name: 'stderr',
        level: 'error',
        filename: path.join(rootPath, './distribute-err.log'),
        json: false,
        prettyPrint: true,
        showLevel: true,
        formatter(options) {
            return `${new Date()} [${options.level.toUpperCase()}]: ` +
                `${(options.message ? options.message : '')} ` +
                `${(options.meta && Object.keys(options.meta).length ? '\n' + JSON.stringify(options.meta, null, 2) : '')}`;
        },
        options: {
            flags: 'w'
        }
    })
}

// Set custom logger colors and styles
winston.addColors({
    error: ['bgRed', 'white'],
    warn: ['yellow'],
    info: ['cyan'],
    verbose: ['italic', 'dim', 'white'],
    debug: 'magenta',
});

module.exports = logger;