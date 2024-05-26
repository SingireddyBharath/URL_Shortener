const express = require('express');
const router = express.Router();
const handler = require('../controllers/handler')

router.get('/shortenUrl/:id', handler.redirectToLongUrl);
router.post('/shortenUrl', handler.getShortenUrl)
router.delete('/shortenUrl', handler.deleteShortenUrl)

// dev debugging
router.get('/debug/cacheRatio', handler.getCacheRatio)

module.exports = router;