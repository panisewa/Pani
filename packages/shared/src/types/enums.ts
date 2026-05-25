export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
  CUSTOMER = 'CUSTOMER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  ESEWA = 'ESEWA',
  KHALTI = 'KHALTI',
  CREDIT = 'CREDIT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum ProductCategory {
  JAR_20L = 'JAR_20L',
  JAR_10L = 'JAR_10L',
  JAR_5L = 'JAR_5L',
  CUSTOM = 'CUSTOM',
}

export enum TenantStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum TenantPlan {
  STARTER = 'starter',
  GROWTH = 'growth',
  ENTERPRISE = 'enterprise',
}

export enum CustomerType {
  B2C = 'B2C',
  B2B = 'B2B',
}

export enum InventoryLedgerType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN_EMPTY = 'RETURN_EMPTY',
  TRANSFER = 'TRANSFER',
}
