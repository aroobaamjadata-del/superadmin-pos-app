// Database Types for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Tenant, 'id' | 'created_at'>>
        Relationships: any[]
      }
      licenses: {
        Row: License
        Insert: Omit<License, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<License, 'id' | 'created_at'>>
        Relationships: any[]
      }
      pos_devices: {
        Row: POSDevice
        Insert: Omit<POSDevice, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<POSDevice, 'id' | 'created_at'>>
        Relationships: any[]
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
        Relationships: any[]
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
        Relationships: any[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tenant_status: 'active' | 'suspended' | 'pending' | 'deleted'
      license_status: 'active' | 'expired' | 'revoked' | 'pending'
      device_status: 'online' | 'offline' | 'suspended'
      user_role: 'super_admin' | 'admin'
    }
  }
}

// Core entity types
export interface Tenant {
  id: string
  tenant_code: string
  business_name: string
  owner_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  logo_url?: string
  status: 'active' | 'suspended' | 'pending' | 'deleted'
  subscription_plan: 'starter' | 'professional' | 'enterprise'
  max_pos_devices: number
  monthly_revenue?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface License {
  id: string
  tenant_id: string
  license_key: string
  product_name: string
  status: 'active' | 'expired' | 'revoked' | 'pending'
  max_activations: number
  current_activations: number
  issued_at: string
  expires_at: string
  last_checked_at?: string
  hardware_id?: string
  features: string[]
  created_at: string
  updated_at: string
  tenant?: Tenant
}

export interface POSDevice {
  id: string
  tenant_id: string
  license_id?: string
  device_name: string
  hardware_id: string
  status: 'online' | 'offline' | 'suspended'
  last_seen_at?: string
  ip_address?: string
  os_version?: string
  app_version?: string
  location?: string
  offline_checkins: number
  created_at: string
  updated_at: string
  tenant?: Tenant
  license?: License
}

export interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Json
  ip_address?: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  tenant_id?: string
  action_url?: string
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin'
  avatar_url?: string
  last_sign_in_at?: string
}

export interface DashboardStats {
  total_tenants: number
  active_tenants: number
  suspended_tenants: number
  total_licenses: number
  active_licenses: number
  expired_licenses: number
  total_pos_devices: number
  online_pos_devices: number
  total_monthly_revenue: number
  expiring_soon: number
}

export interface UsageTrend {
  date: string
  tenants: number
  licenses: number
  devices: number
  revenue: number
}
