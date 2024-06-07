const { createClient } = require('redis');
const __logger = require('#logger');

async function createRedisClient() {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    }
  });
  client.on('error', error => __logger.error('Redis Client Error:', error));
  client.on('connect', () => __logger.info('Redis Client Connected!'));

  await client.connect();

  return client;
}

module.exports = createRedisClient;