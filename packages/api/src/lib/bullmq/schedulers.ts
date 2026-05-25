import { inventoryCheckQueue } from './queues.js'

export async function startScheduledJobs(): Promise<void> {
  await inventoryCheckQueue.add(
    'periodic-check',
    {},
    {
      repeat: { every: 60 * 60 * 1000 },
      jobId: 'inventory-check-periodic',
    }
  )
}
