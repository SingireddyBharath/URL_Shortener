require('./config')
const express = require('express');
const app = express();
const httpContext = require('express-http-context');
const router = require('./src/routes/routes')
const addRequestId = require('./src/middlewares/requestId')
const connectDB = require('./src/database/mongoDB')
const port = process.env.PORT || 3003;

app.use(httpContext.middleware);
// Middleware to attach UUID to each request
app.use(addRequestId);
// Health check endpoint
app.get('/api/health', (req, res) => {
    __logger.info("Health check endpoint")
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