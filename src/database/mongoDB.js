const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        __logger.info("Successfully connected to the database");
    } catch (err) {
        __logger.error("Connection error", err);
        process.exit();
    }
};

module.exports = connectDB;
