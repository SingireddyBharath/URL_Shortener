const express = require('express');
const app = express();
const router = require('./src/routes/routes')
require('./config')
const port = process.env.PORT || 3003;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).send("OK");
});

// Use your router for other endpoints
app.use('/api/v1', router);
app.listen(port, () => console.log(`Server is running on port ${port}`));
app.disable('x-powered-by');