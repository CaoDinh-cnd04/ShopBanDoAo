/**
 * Request Logging Middleware
 */

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom token for request ID
morgan.token('request-id', (req) => {
    return req.id || 'unknown';
});

// Custom format
const format = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

// Console logger (development)
const consoleLogger = morgan('dev');

// File logger (production)
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);
const fileLogger = morgan(format, {
    stream: accessLogStream
});

// Error logger stream
const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
);

const logger = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        fileLogger(req, res, () => {});
    } else {
        consoleLogger(req, res, () => {});
    }
    next();
};

// Log errors
const logError = (error, req = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${error.stack || error.message}\n`;
    
    errorLogStream.write(logMessage);
    
    if (process.env.NODE_ENV !== 'production') {
        console.error(logMessage);
    }
};

module.exports = {
    logger,
    logError,
    errorLogStream
};
