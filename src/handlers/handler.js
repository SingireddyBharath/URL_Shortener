const __logger = require("#logger");

const getShortenUrl = async (req, res) => {
    __logger.info("getShortenUrl called with " + JSON.stringify(req.body));
    res.json({ "status": "ok" });
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