const redis = require('redis');
const __logger = require('#logger');

function createRedisClient() {
  const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  });

  return client;
}

module.exports = createRedisClient;