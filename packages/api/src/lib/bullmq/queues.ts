import { Queue } from 'bullmq'
import { redis } from '../redis.js'

const connection = redis

export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})

export const pdfQueue = new Queue('pdf-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
})

export const inventoryCheckQueue = new Queue('inventory-check', {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  },
})
