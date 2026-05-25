import type { CustomerType } from '@panisewa/shared'

export interface ICustomer {
  id: string
  tenantId: string
  userId: string | null
  type: CustomerType
  name: string
  phone: string | null
  email: string | null
  address: Record<string, unknown> | null
  creditLimit: number
  creditTerms: 'net30' | 'net60' | 'net90' | null
  notes: string | null
  isActive: boolean
  createdAt: string
}
