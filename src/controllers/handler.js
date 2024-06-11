const crypto = require('crypto');
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bx = require('base-x');
const __logger = require("#logger");
const redisUtils = require('#redisUtils');
const { getSingleItemById, deleteSingleItemById, insertItem } = require('../database/dynamoDB')

const getShortenUrl = async (req, res) => {
    const longUrl = req.body.longUrl;
    let url, shortId;

    try {
        shortId = generateShortId(longUrl)
        // Find whether longUrl is already present
        url = await getSingleItemById({ shortId: shortId });
    } catch (error) {
        __logger.error(`Error fetching from database: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    if (!url) {
        try {
            // generate short id if longUrl not exists in db
            url = { shortId, longUrl };
            await insertItem(url);
            __logger.info(`URL_SHORTENED: Successfully - ${JSON.stringify(url)}`);
        } catch (error) {
            __logger.error(`Error inserting into database: ${error.message}`);
            return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
        }
    } else {
        __logger.info(`URL_EXIST: URL was already shortened - ${JSON.stringify(url)}`);
    }

    const fullUrl = `${req.protocol}://${req.get('host')}/dev/shortenUrl`;
    return res.json({ "status": "ok", "shortUrl": `${fullUrl}/${url.shortId}` });
};

const redirectToLongUrl = async (req, res) => {
    const shortId = req.params.id;
    let cacheData, dbData, longUrl = '';
    let cacheRatio;

    try {
        cacheData = await redisUtils.getDataByCollectionName(process.env.REDIS_COLLECTION, shortId);
    } catch (error) {
        __logger.error(`Error fetching from Redis: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    if (!cacheData) {
        try {
            dbData = await getSingleItemById({ shortId });
        } catch (error) {
            __logger.error(`Error fetching from database: ${error.message}`);
            return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
        }

        if (!dbData) {
            __logger.info(`DB_MISS: ${shortId} not found in database`);
            return res.status(404).json({ "status": "error", message: "Invalid URL" });
        }

        __logger.info(`CACHE_MISS: ${shortId} not found in redis`);
        try {
            cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS");
            __logger.info(`CACHE_MISS_UPDATE: updating cache miss ${cacheRatio + 1} in redis`);
            await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS", cacheRatio + 1)
        } catch (error) {
            __logger.error(`Error updating Redis: ${error.message}`);
            return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
        }

        longUrl = dbData.longUrl;

        const urlData = {
            longUrl: longUrl
        };
        __logger.info(`CACHE_SET: setting ${shortId} in redis`);
        try {
            await redisUtils.setDataByCollectionName(process.env.REDIS_COLLECTION, shortId, urlData);
        } catch (error) {
            __logger.error(`Error setting Redis: ${error.message}`);
            return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
        }
    } else {
        __logger.info(`CACHE_HIT: ${shortId} found in redis`);

        try {
            cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT");
            __logger.info(`CACHE_HIT_UPDATE: updating cache hit ${cacheRatio + 1} in redis`)
            await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT", cacheRatio + 1);
        } catch (error) {
            __logger.error(`Error updating Redis: ${error.message}`);
            return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
        }

        longUrl = cacheData.longUrl;
    }

    if (!longUrl) {
        __logger.error('Long URL is not defined');
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    __logger.info(`REDIRECT: redirecting to ${longUrl}`)
    return res.redirect(302, longUrl);
};

const deleteShortenUrl = async (req, res) => {
    const shortUrl = req.body.shortUrl;
    const splitUrl = shortUrl.split('/');
    const shortId = splitUrl[splitUrl.length - 1];

    let url;

    try {
        url = await getSingleItemById({ shortId });
    } catch (error) {
        __logger.error(`Error fetching from database: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    if (!url) {
        __logger.info(`URL_NOT_FOUND: Invalid URL - ${shortUrl}`);
        return res.status(404).json({ "status": "error", message: "Invalid URL" });
    }

    try {
        await deleteSingleItemById({ shortId });
    } catch (error) {
        __logger.error(`Error deleting from database: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    try {
        await redisUtils.deleteDataByCollectionName(process.env.REDIS_COLLECTION, shortId);
    } catch (error) {
        __logger.error(`Error deleting from Redis: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    __logger.info(`URL_DELETED: URL deleted successfully - ${shortUrl}`);
    return res.status(200).json({ message: "URL deleted successfully !" });
};

const getCacheRatio = async (req, res) => {
    let cacheMiss, cacheHit;

    try {
        cacheMiss = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS");
        cacheHit = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT");
    } catch (error) {
        __logger.error(`CACHE_FETCH_ERROR: ${error.message}`);
        return res.status(500).json({ "status": "error", message: 'Internal Server Error.' });
    }

    if (isNaN(cacheHit) || isNaN(cacheMiss)) {
        const errorMessage = 'Fetched cache data is not valid.';
        __logger.error(`CACHE_DATA_INVALID: ${errorMessage}`);
        return res.status(500).json({ "status": "error", message: errorMessage });
    }

    const ratio = ((cacheHit / (cacheHit + cacheMiss)) * 100).toFixed(2);

    const cacheRatio = {
        cacheMiss,
        cacheHit,
        cacheRatio: parseFloat(ratio),
    };

    __logger.info(`CACHE_RATIO_RETRIEVED: Successfully retrieved cache ratio - ${JSON.stringify(cacheRatio)}`);
    return res.json(cacheRatio);
};

function generateShortId(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');

    // Encode the whole hash
    const encodedHash = bx(BASE62).encode(Buffer.from(hash));

    // If the length is more than 7, cut it down to 7
    const shortId = encodedHash.length > 7 ? encodedHash.substring(0, 7) : encodedHash;

    return shortId;
}

module.exports = {
    getShortenUrl,
    redirectToLongUrl,
    deleteShortenUrl,
    getCacheRatio
}