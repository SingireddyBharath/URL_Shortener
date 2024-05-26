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
            __logger.error(`REDIS_CONNECTION_ERROR: Failed to connect to Redis. Error: ${error.message}`);
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
    } catch (error) {
        __logger.error(`SET_DATA_ERROR: Failed to set data in ${collectionName} collection. Key: ${key}. Error: ${error.message}`);
        throw error;
    }
}

redisUtils.getDataByCollectionName = async function (collectionName, key = null) {
    const client = await getRedisClient();
    try {
        const data = await client.hGet(collectionName, key);
        if (data != null) {
            return JSON.parse(data);
        } else {
            __logger.warn(`Key: ${key} not found in collection: ${collectionName}`)
            return null;
        }
    } catch (error) {
        __logger.error(`GET_DATA_ERROR: Failed to get data from ${collectionName} collection. Key: ${key}. Error: ${error.message}`);
        throw error;
    }
}

redisUtils.deleteDataByCollectionName = async function (collectionName, key) {
    const client = await getRedisClient();
    try {
        await client.hDel(collectionName, key);
    } catch (error) {
        __logger.error(`DELETE_DATA_ERROR: Failed to delete data from ${collectionName} collection. Key: ${key}. Error: ${error.message}`);
        throw error;
    }
}

module.exports = redisUtils;