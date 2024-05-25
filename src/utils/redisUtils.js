const createRedisClient = require('../database/redisClient');
const __logger = require('#logger');
let redisUtils = {};
let client;

async function getRedisClient() {
    if (!client) {
        try {
            client = await createRedisClient();
            await client.connect();
        } catch (error) {
            __logger.error(`Failed to get Redis client: ${error.message}`);
            throw error;
        }
    } else {
        __logger.info('Redis client already exists.');
    }

    return client;
}
redisUtils.setDataByCollectionName = async function (collectionName, key, value) {
    const client = await getRedisClient();
    try {
        await client.hSet(collectionName, key, JSON.stringify(value));
    }
    catch (error) {
        __logger.error(`Error in setDataByCollectionName ${error.message}`);
    }
}
redisUtils.getDataByCollectionName = async function (collectionName, key) {
    const client = await getRedisClient();
    try {
        const data = await client.hGet(collectionName, key);
        if (data != null) {
            return JSON.parse(data);
        } else {
            __logger.warn(`Key: ${key} not found in collection: ${collectionName}`);
            return null;
        }
    }
    catch (error) {
        __logger.error(`Error in getDataByCollectionName ${error.message}`);
        throw error;
    }
}

module.exports = redisUtils;