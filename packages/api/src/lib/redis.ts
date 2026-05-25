import IORedis from 'ioredis'

const redisUrl = process.env['REDIS_URL']

if (!redisUrl) {
  throw new Error('Missing REDIS_URL env var')
}

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
})

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err)
})
