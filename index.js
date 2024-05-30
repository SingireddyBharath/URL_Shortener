require('./config')
const express = require('express');
const app = express();
const httpContext = require('express-http-context');
const bodyParser = require('body-parser');
const swaggerDocs = require('./src/docs/swagger');
const router = require('./src/routes/routes')
const addRequestId = require('./src/middlewares/requestId')
const connectDB = require('./src/database/mongoDB')
const port = process.env.PORT || 3002;

app.use(bodyParser.json());

app.use(httpContext.middleware);
// Middleware to attach UUID to each request
app.use(addRequestId);
// For Swagger docs
swaggerDocs(app);
// Health check endpoint
app.get('/api/health', (req, res) => {
    __logger.info("Health check")
    res.status(200).send("OK");
});
// Use your router for other endpoints
app.use('/api/v1', router);
//  connecting to database
connectDB()
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});
app.disable('x-powered-by');