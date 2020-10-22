const winston = require("winston");
const path = require("path");
const { createLogger, format, transports } = winston;

module.exports = createLogger({
    format: format.combine(
        format.splat(),
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(
            log => {
                if (log.stack) return `[${log.timestamp}] [${log.level}] ${log.stack}`;
                return `[${log.timestamp}] [${log.level}] ${log.message}`;
            },
        ),
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            level: 'error',
            filename: path.join(__dirname, '..', 'storage/logs', 'error.log')
        }),
        new transports.File({
            level: 'info',
            filename: path.join(__dirname, '..', 'storage/logs', 'info.log')
        })
    ],
})