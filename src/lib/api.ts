import { supabase } from '@/lib/supabase'
import type { Tenant, License, POSDevice, DashboardStats } from '@/types/database'
import { generateTenantCode, generateLicenseKey } from '@/lib/utils'

// ========================
// TENANT API
// ========================
export const tenantApi = {
  async list() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Tenant[]
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Tenant
  },

  async create(tenant: Omit<Tenant, 'id' | 'tenant_code' | 'created_at' | 'updated_at'>) {
    const tenant_code = generateTenantCode()
    const { data, error } = await supabase
      .from('tenants')
      .insert([{ ...tenant, tenant_code }])
      .select()
      .single()
    if (error) throw error
    await auditApi.log('CREATE', 'tenant', data.id, { business_name: tenant.business_name })
    return data as Tenant
  },

  async update(id: string, updates: Partial<Tenant>) {
    const { data, error } = await supabase
      .from('tenants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await auditApi.log('UPDATE', 'tenant', id, updates)
    return data as Tenant
  },

  async softDelete(id: string) {
    const { error } = await supabase
      .from('tenants')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await auditApi.log('DELETE', 'tenant', id, {})
  },

  async suspend(id: string) {
    return tenantApi.update(id, { status: 'suspended' })
  },

  async activate(id: string) {
    return tenantApi.update(id, { status: 'active' })
  },
}

// ========================
// LICENSE API
// ========================
export const licenseApi = {
  async list(tenantId?: string) {
    let query = supabase
      .from('licenses')
      .select('*, tenant:tenants(business_name, tenant_code)')
      .order('created_at', { ascending: false })
    if (tenantId) query = query.eq('tenant_id', tenantId)
    const { data, error } = await query
    if (error) throw error
    return data as License[]
  },

  async get(id: string) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, tenant:tenants(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as License
  },

  async generate(params: {
    tenant_id: string
    product_name: string
    max_activations: number
    expires_at: string
    features: string[]
  }) {
    const license_key = generateLicenseKey()
    const { data, error } = await supabase
      .from('licenses')
      .insert([{
        ...params,
        license_key,
        status: 'active',
        current_activations: 0,
        issued_at: new Date().toISOString(),
      }])
      .select()
      .single()
    if (error) throw error
    await auditApi.log('CREATE', 'license', data.id, { license_key, tenant_id: params.tenant_id })
    return data as License
  },

  async revoke(id: string) {
    const { data, error } = await supabase
      .from('licenses')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await auditApi.log('REVOKE', 'license', id, {})
    return data as License
  },

  async activate(id: string) {
    const { data, error } = await supabase
      .from('licenses')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await auditApi.log('ACTIVATE', 'license', id, {})
    return data as License
  },

  async verify(licenseKey: string, hardwareId: string) {
    const { data, error } = await supabase
      .from('licenses')
      .select('*, tenant:tenants(*)')
      .eq('license_key', licenseKey)
      .single()
    if (error) return { valid: false, reason: 'License not found' }
    if (data.status !== 'active') return { valid: false, reason: `License is ${data.status}` }
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('licenses').update({ status: 'expired' }).eq('id', data.id)
      return { valid: false, reason: 'License has expired' }
    }
    if (data.current_activations >= data.max_activations && data.hardware_id !== hardwareId) {
      return { valid: false, reason: 'Max activations reached' }
    }
    // Update last checked
    await supabase
      .from('licenses')
      .update({ last_checked_at: new Date().toISOString(), hardware_id: hardwareId })
      .eq('id', data.id)
    return { valid: true, license: data, tenant: data.tenant }
  },
}

// ========================
// POS DEVICES API
// ========================
export const posDeviceApi = {
  async list(tenantId?: string) {
    let query = supabase
      .from('pos_devices')
      .select('*, tenant:tenants(business_name, tenant_code), license:licenses(license_key, status)')
      .order('created_at', { ascending: false })
    if (tenantId) query = query.eq('tenant_id', tenantId)
    const { data, error } = await query
    if (error) throw error
    return data as POSDevice[]
  },

  async register(device: Omit<POSDevice, 'id' | 'created_at' | 'updated_at' | 'offline_checkins'>) {
    const { data, error } = await supabase
      .from('pos_devices')
      .insert([{ ...device, offline_checkins: 0 }])
      .select()
      .single()
    if (error) throw error
    await auditApi.log('REGISTER', 'pos_device', data.id, { device_name: device.device_name })
    return data as POSDevice
  },

  async checkIn(hardwareId: string, online = true) {
    const { data: device, error } = await supabase
      .from('pos_devices')
      .select('*')
      .eq('hardware_id', hardwareId)
      .single()
    if (error) return { success: false, reason: 'Device not found' }

    const updates: Partial<POSDevice> = {
      last_seen_at: new Date().toISOString(),
      status: online ? 'online' : 'offline',
    }
    if (!online) {
      updates.offline_checkins = (device.offline_checkins || 0) + 1
    }
    await supabase.from('pos_devices').update(updates).eq('id', device.id)
    return { success: true, device }
  },

  async suspend(id: string) {
    const { error } = await supabase
      .from('pos_devices')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await auditApi.log('SUSPEND', 'pos_device', id, {})
  },

  async delete(id: string) {
    const { error } = await supabase.from('pos_devices').delete().eq('id', id)
    if (error) throw error
    await auditApi.log('DELETE', 'pos_device', id, {})
  },
}

// ========================
// AUDIT LOG API
// ========================
export const auditApi = {
  async log(action: string, resourceType: string, resourceId: string, details: object) {
    try {
      await supabase.from('audit_logs').insert([{
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        user_email: 'superadmin@system.local',
        created_at: new Date().toISOString(),
      }])
    } catch {
      // Silently fail audit logs
    }
  },

  async list(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },
}

// ========================
// DASHBOARD STATS (with mock for demo)
// ========================
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      const [tenantsData, licensesData, devicesData] = await Promise.all([
        supabase.from('tenants').select('status, monthly_revenue').neq('status', 'deleted'),
        supabase.from('licenses').select('status, expires_at'),
        supabase.from('pos_devices').select('status'),
      ])

      const tenants = tenantsData.data || []
      const licenses = licensesData.data || []
      const devices = devicesData.data || []

      const now = new Date()
      const sevenDays = new Date(now.getTime() + 7 * 86400000)

      return {
        total_tenants: tenants.length,
        active_tenants: tenants.filter((t) => t.status === 'active').length,
        suspended_tenants: tenants.filter((t) => t.status === 'suspended').length,
        total_licenses: licenses.length,
        active_licenses: licenses.filter((l) => l.status === 'active').length,
        expired_licenses: licenses.filter((l) => l.status === 'expired').length,
        total_pos_devices: devices.length,
        online_pos_devices: devices.filter((d) => d.status === 'online').length,
        total_monthly_revenue: tenants.reduce((s, t) => s + (t.monthly_revenue || 0), 0),
        expiring_soon: licenses.filter((l) => {
          const exp = new Date(l.expires_at)
          return exp > now && exp <= sevenDays
        }).length,
      }
    } catch {
      // Return mock data if DB not connected
      return getMockStats()
    }
  },
}

function getMockStats(): DashboardStats {
  return {
    total_tenants: 47,
    active_tenants: 38,
    suspended_tenants: 5,
    total_licenses: 124,
    active_licenses: 98,
    expired_licenses: 14,
    total_pos_devices: 312,
    online_pos_devices: 287,
    total_monthly_revenue: 48750,
    expiring_soon: 8,
  }
}
