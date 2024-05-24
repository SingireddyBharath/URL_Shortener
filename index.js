const express = require('express');
const app = express();
require('./config')
const port = process.env.PORT || 3003;

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP'
    });
});

app.listen(port, () => console.log(`Server is running on port ${port}`));
