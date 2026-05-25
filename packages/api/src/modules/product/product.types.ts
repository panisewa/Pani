import type { ProductCategory } from '@panisewa/shared'

export interface IProduct {
  id: string
  tenantId: string
  nameEn: string
  nameNe: string
  sku: string | null
  category: ProductCategory | null
  priceB2c: number   // paisa
  priceB2b: number   // paisa
  depositAmount: number
  reorderLevel: number
  isActive: boolean
  imageUrl: string | null
  createdAt: string
}
