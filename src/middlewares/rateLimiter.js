const { bucket } = require('./TokenBucket')

const rateLimiter = (req, res, next) => {
    if (bucket.consume()) {
        next(); // Continue the request
    } else {
        res.status(429).send('Too many requests');
    }
}

module.exports = rateLimiter;