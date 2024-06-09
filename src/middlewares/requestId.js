const uuidv4 = require('uuid').v4;
const __logger = require('#logger');
const httpContext = require('express-http-context');

module.exports = function addRequestId(req, res, next) {
    const requestId = uuidv4();
    req.id = requestId;
    httpContext.set('reqId', requestId);

    let requestData = JSON.stringify(req.body);
    if (requestData.length > 1000) // limit size for big payloads
        requestData = `${requestData.slice(0, 1000)}...`;

    // Log when request starts
    __logger.info(`Request ${requestId} started: ${req.method} ${req.path}`);
    __logger.info(`Request body : ${requestData}`);
    // Hook into response completion event
    res.on('finish', () => {
        // Log when request finishes
        __logger.info(`Request ${requestId} finished: ${res.statusCode}`);
    });

    next();
};