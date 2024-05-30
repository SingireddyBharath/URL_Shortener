const express = require('express');
const router = express.Router();
const handler = require('../controllers/handler')

/**
 * @swagger
 * /api/v1/shortenUrl/{id}:
 *   get:
 *     summary: Redirect to long URL
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The shortened URL ID
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to the long URL
 */
router.get('/shortenUrl/:id', handler.redirectToLongUrl);

/**
 * @swagger
 * /api/v1/shortenUrl:
 *   post:
 *     summary: Shorten a long URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               longUrl:
 *                 type: string
 *                 description: The long URL to be shortened
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shortenedUrl:
 *                   type: string
 *                   description: The shortened URL
 */

router.post('/shortenUrl', handler.getShortenUrl)

/**
 * @swagger
 * /api/v1/shortenUrl:
 *   delete:
 *     summary: Delete a short url
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shortUrl:
 *                 type: string
 *                 description: The Short URL to be deleted
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: URL deleted successfully !
 */
router.delete('/shortenUrl', handler.deleteShortenUrl)


// dev debugging
/**
 * @swagger
 * /api/v1/debug/cacheRatio:
 *   get:
 *     summary: Get Cache Ratio
 *     responses:
 *       200:
 *         description: Get Cache Ratio
 */
router.get('/debug/cacheRatio', handler.getCacheRatio)

module.exports = router;