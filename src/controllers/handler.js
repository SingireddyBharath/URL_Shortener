const __logger = require("#logger");
const Url = require('../schemas/urlSchema');

const getShortenUrl = async (req, res) => {
    __logger.info("getShortenUrl called with " + JSON.stringify(req.body));
    try {
        const newUrl = new Url({ longUrl: 'https://google.coms', shortId: "asdfas3232" });        
        const result = await newUrl.save();
        __logger.info("newUrl: " + JSON.stringify(result));
        res.json(result);
    } catch (error) {
        __logger.error(error);
        res.status(500).json({ "status": "error", message: error.message });
    }
}
const redirectToLongUrl = async (req, res) => {
    const shortId = req.params.id
    __logger.info("redirect to Long url called with shortId" + shortId);
    res.json({ "status": "ok" });
}
module.exports = {
    getShortenUrl,
    redirectToLongUrl
}