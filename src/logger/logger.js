const { createLogger, format, transports } = require('winston');
const httpContext = require('express-http-context');

// prepare array for setting transports conditionally
let _transports = []
if (process.env.NODE_ENV == 'local') {
    // In local environment, log to console
    _transports.push(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple(),
                format.printf(({ level, message, label, timestamp, stack }) => {
                    const requestId = httpContext.get('reqId') || '';
                    return `${timestamp} [${requestId}] ${level}: ${stack || message}`;
                })
            )
        })
    );
} else {
    // In non-local environments, log to files
    _transports.push(
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    );
}

const __logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ level, message, label, timestamp, stack }) => {
            const requestId = httpContext.get('reqId') || '';
            return `${timestamp} [${requestId}] ${level}: ${stack || message}`;
        })
    ),
    defaultMeta: { service: 'url-shortener' },
    transports: _transports,
});

global.__logger = __logger;
module.exports = __logger;

