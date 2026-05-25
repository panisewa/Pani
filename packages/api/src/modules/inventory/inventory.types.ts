import type { InventoryLedgerType } from '@panisewa/shared'

export interface IInventoryLedger {
  id: string
  tenantId: string
  productId: string
  type: InventoryLedgerType
  quantity: number
  balanceBefore: number
  balanceAfter: number
  referenceId: string | null
  referenceType: 'order' | 'purchase_order' | 'manual' | null
  note: string | null
  createdBy: string | null
  createdAt: string
}

export interface IStockLevel {
  productId: string
  currentStock: number
  reorderLevel: number
  isLow: boolean
}
