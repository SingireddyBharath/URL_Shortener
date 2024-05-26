const uuidv4 = require('uuid').v4;
const __logger = require('#logger');
const httpContext = require('express-http-context');

module.exports = function addRequestId(req, res, next) {
    const requestId = uuidv4();
    req.id = requestId;
    httpContext.set('reqId', requestId);
    __logger.info(`added requestId: ${req.id}`);
    next();
};
    