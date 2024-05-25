const __logger = require("#logger");
const Url = require('../schemas/urlSchema');
const redisUtils = require('#redisUtils');

const getShortenUrl = async (req, res) => {
    try {
        const longUrl = req.body.longUrl;

        // Find whether longUrl is already present
        let url = await Url.findOne({ longUrl: longUrl });

        if (url) {
            console.log('URL was already shortened', url);
        } else {
            // generate short id if longUrl not exists in db
            const shortId = generateShortId();
            url = new Url({ shortId: shortId, longUrl: longUrl });
            await url.save();
            console.log('Successfully shortened URL', url);
        }
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.json({ "status": "ok", "shortUrl": `${fullUrl}/${url.shortId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ "status": "error", message: error.message });
    }
}

const redirectToLongUrl = async (req, res) => {
    try {
        // check cache 
        const shortId = req.params.id;
        let cacheData, dbData, longUrl = '';
        let cacheRatio;

        try {
            cacheData = await redisUtils.getDataByCollectionName(process.env.REDIS_COLLECTION, shortId);

            if (cacheData === null) {
                __logger.info(`${shortId} not found in redis - cache miss`);
                cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS")
                await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "MISS", cacheRatio + 1)

                dbData = await Url.findOne({ shortId: shortId });

                if (!dbData) {
                    __logger.info(`${shortId} not found in database - db miss`);
                    res.status(404).json({ "status": "error", message: "Invalid URL" });
                    return;
                }

                longUrl = dbData.longUrl;

                // update cache with new data
                const urlData = {
                    longUrl: dbData.longUrl,
                    clickCount: dbData.clickCount,
                    createdAt: dbData.createdAt
                }
                await redisUtils.setDataByCollectionName(process.env.REDIS_COLLECTION, shortId, urlData);
            } else {
                cacheRatio = await redisUtils.getDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT");
                await redisUtils.setDataByCollectionName(process.env.REDIS_CACHE_HEALTH, "HIT", cacheRatio + 1);

                __logger.info(`${shortId} found in redis - cache hit`);
                longUrl = cacheData.longUrl;
            }

            // redirect to the stored URL
            res.redirect(302, longUrl);

        } catch (err) {
            console.error(err);
            res.status(500).json({ "status": "error", message: "Server Error" });
        }

    }
    catch (error) {
        __logger.error(error);
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
    redirectToLongUrl
}