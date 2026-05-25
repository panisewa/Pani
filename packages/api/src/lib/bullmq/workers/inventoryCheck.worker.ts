import { Worker } from 'bullmq'
import { redis } from '../../redis.js'
import { notificationQueue } from '../queues.js'
import { supabaseAdmin } from '../../supabase.js'
import { getLowStockItems } from '../../../modules/inventory/inventory.service.js'

export const inventoryCheckWorker = new Worker(
  'inventoryCheck',
  async () => {
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('status', 'active')

    if (error || !tenants) return

    for (const tenant of tenants as { id: string }[]) {
      const lowItems = await getLowStockItems(tenant.id)
      if (lowItems.length === 0) continue

      await notificationQueue.add('low-stock-alert', {
        tenantId: tenant.id,
        lowStockItems: lowItems,
        alertedAt: new Date().toISOString(),
      })
    }
  },
  { connection: redis }
)
