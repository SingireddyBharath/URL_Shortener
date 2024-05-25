const express = require('express');
const router = express.Router();
const handler = require('../controllers/handler')

router.get('/shortenUrl/:id', handler.redirectToLongUrl);
router.post('/shortenUrl', handler.getShortenUrl)

module.exports = router;