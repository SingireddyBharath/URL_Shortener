const getShortenUrl = async (req, res) => {
    res.json({ "status": "ok" });
}
const redirectToLongUrl = async (req, res) => {
    const shortId = req.params.id
    console.log("short id " + shortId)
    res.json({ "status": "ok" });
}
module.exports = {
    getShortenUrl,
    redirectToLongUrl
}