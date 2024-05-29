const __logger = require("#logger");
const Url = require('../schemas/urlSchema');
const redisUtils = require('#redisUtils');

const getShortenUrl = async (req, res) => {
    try {
        const longUrl = req.body.longUrl;

        // Find whether longUrl is already present
        let url = await Url.findOne({ longUrl: longUrl });

        if (url) {
            __logger.info(`URL_EXIST: URL was already shortened - ${url}`);
        } else {
            // generate short id if longUrl not exists in db
            const shortId = generateShortId();
            url = new Url({ shortId: shortId, longUrl: longUrl });
            await url.save();
            __logger.info(`URL_SHORTENED: Successfully shortened URL - ${url}`);
        }
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.json({ "status": "ok", "shortUrl": `${fullUrl}/${url.shortId}` });
    } catch (error) {
        __logger.error(`ERROR: ${error.message}`);
        res.status(500).json({ "status": "error", message: error.message });
    }
}

const redirectToLongUrl = async (req, res) => {
    try {
        const shortId = req.params.id;
        let cacheData, dbData, longUrl = '';
        let cacheRatio;

        try {
            cacheData = await redisUtils.getDataByCollectionName(process.env.REDIS_COLLECTION, shortId);

            if (cacheData === null) {

                dbData = await Url.findOne({ shortId: shortId });

                if (!dbData) {
                    __logger.info(`DB_MISS: ${shortId} not found in database`);
                    res.status(404).json({ "status": "error", message: "Invalid URL" });
                    return;
                }

                __logger.info(`CACHE_MISS: ${shortId} not found in redis`);
                cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS");
                __logger.info(`CACHE_MISS_UPDATE: updating cache miss ${cacheRatio} in redis`)
                await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS", cacheRatio + 1)

                longUrl = dbData.longUrl;

                const urlData = {
                    longUrl: dbData.longUrl,
                    clickCount: dbData.clickCount,
                    createdAt: dbData.createdAt
                }
                __logger.info(`CACHE_SET: setting ${shortId} in redis`);
                await redisUtils.setDataByCollectionName(process.env.REDIS_COLLECTION, shortId, urlData);
            } else {
                __logger.info(`CACHE_HIT: ${shortId} found in redis`);

                cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT");
                __logger.info(`CACHE_HIT_UPDATE: updating cache hit ${cacheRatio} in redis`)
                await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT", cacheRatio + 1);

                longUrl = cacheData.longUrl;
            }
            __logger.info(`REDIRECT: redirecting to ${longUrl}`)
            res.redirect(302, longUrl);

        } catch (err) {
            console.error(err);
            res.status(500).json({ "status": "error", message: "Server Error" });
        }
    }
    catch (error) {
        __logger.error(`ERROR: ${error.message}`);
        res.status(500).json({ "status": "error", message: error.message });
    }
}

const deleteShortenUrl = async (req, res) => {
    try {
        const shortUrl = req.body.shortUrl;
        const splitUrl = shortUrl.split('/');
        const shortId = splitUrl[splitUrl.length - 1]

        const url = await Url.findOne({ shortId: shortId });

        if (!url) {
            __logger.info(`URL_NOT_FOUND: Invalid URL - ${shortUrl}`);
            res.status(404).json({ "status": "error", message: "Invalid URL" });
            return;
        }

        await Url.deleteOne({ shortId: shortId });
        await redisUtils.deleteDataByCollectionName(process.env.REDIS_COLLECTION, shortId);

        __logger.info(`URL_DELETED: URL deleted successfully - ${shortUrl}`);
        res.status(200).json({ message: "URL deleted successfully !" });
    } catch (error) {
        __logger.error(`ERROR: ${error.message}`);
        res.status(500).json({ "status": "error", message: error.message });
    }
}

const getCacheRatio = async (req, res) => {
    try {
        const cacheMiss = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS");
        const cacheHit = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT");

        if (isNaN(cacheHit) || isNaN(cacheMiss)) {
            __logger.error(`CACHE_FETCH_FAILED: Could not fetch cache data`);
            throw new Error('Could not fetch cache data');
        }

        let ratio = ((cacheHit / (cacheHit + cacheMiss)) * 100).toFixed(2);

        const cacheRatio = {
            cacheMiss,
            cacheHit,
            cacheRatio: parseFloat(ratio),
        }

        __logger.info(`CACHE_RATIO_RETRIEVED: Successfully retrieved cache ratio - ${JSON.stringify(cacheRatio)}`);
        res.json(cacheRatio);
    } catch (error) {
        __logger.error(`ERROR: ${error.message}`);
        res.status(500).json({ "status": "error", message: error.message });
    }
}

function generateShortId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = {
    getShortenUrl,
    redirectToLongUrl,
    deleteShortenUrl,
    getCacheRatio
}