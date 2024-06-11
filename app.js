require('./config')
const express = require('express');
const app = express();
const httpContext = require('express-http-context');
const bodyParser = require('body-parser');
const swaggerDocs = require('./src/docs/swagger');
const router = require('./src/routes/routes')
const addRequestId = require('./src/middlewares/requestId')
const rateLimiter = require('./src/middlewares/rateLimiter');
const { redirectToLongUrl } = require('./src/controllers/handler');
const port = process.env.PORT || 3002;

app.use(rateLimiter);

app.use(bodyParser.json());

app.use(httpContext.middleware);
// Middleware to attach UUID to each request
app.use(addRequestId);
// For Swagger docs
swaggerDocs(app);
// Health check endpoint
app.get('/shortenUrl/:id', redirectToLongUrl)

app.get('/api/health', (req, res) => {
    __logger.info("Health check")
    res.status(200).send("OK");
});
// Use your router for other endpoints
app.use('/api/v1', router);
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`)
});

module.exports = app;
app.disable('x-powered-by');