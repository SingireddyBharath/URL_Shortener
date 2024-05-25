const mongoose = require('mongoose');

let UrlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true,
        unique: true,
    },
    shortId: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    clickCount: {
        type: Number,
        default: 0,
    }
});

module.exports = mongoose.model('urls', UrlSchema)
