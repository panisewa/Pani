export interface TenantSettings {
  vatRegistered?: boolean
  panNumber?: string
  fiscalYear?: string
  defaultLanguage?: 'en' | 'ne'
  timezone?: string
  address?: {
    street?: string
    city?: string
    district?: string
    province?: number
  }
  phone?: string
}

export interface ITenant {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  status: 'trial' | 'active' | 'suspended'
  plan: 'starter' | 'growth' | 'enterprise'
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

export interface TenantUsageStats {
  userCount: number
  planLimits: {
    users: number
    storageGb: number
  }
}
