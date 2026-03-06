import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2, Ban, CheckCircle,
  Copy, RefreshCw, Building2, ChevronDown, X, Loader2, Eye
} from 'lucide-react'
import { tenantApi } from '@/lib/api'
import {
  generateTenantCode, formatDate, getStatusBadgeClass,
  copyToClipboard, getInitials, formatCurrency
} from '@/lib/utils'
import type { Tenant } from '@/types/database'
import toast from 'react-hot-toast'

// ── Mock demo data so the UI looks populated ──
const DEMO_TENANTS: Tenant[] = [
  {
    id: '1', tenant_code: 'TEN-P8X2K3', business_name: 'Portobello Bistro',
    owner_name: 'Marco Rossi', email: 'marco@portobello.com', phone: '+1-555-0101',
    city: 'New York', country: 'USA', status: 'active', subscription_plan: 'enterprise',
    max_pos_devices: 20, monthly_revenue: 8400, created_at: '2025-01-15T10:00:00Z', updated_at: '2026-01-10T09:00:00Z',
  },
  {
    id: '2', tenant_code: 'TEN-S7Y4M1', business_name: 'Sunrise Café Chain',
    owner_name: 'Sarah Johnson', email: 'sarah@sunrise.com', phone: '+1-555-0102',
    city: 'Chicago', country: 'USA', status: 'active', subscription_plan: 'professional',
    max_pos_devices: 15, monthly_revenue: 7200, created_at: '2025-02-20T10:00:00Z', updated_at: '2026-01-15T09:00:00Z',
  },
  {
    id: '3', tenant_code: 'TEN-M5R9Q6', business_name: 'Metro Burger Co.',
    owner_name: 'James Wilson', email: 'james@metroburger.com', phone: '+1-555-0103',
    city: 'Houston', country: 'USA', status: 'active', subscription_plan: 'professional',
    max_pos_devices: 12, monthly_revenue: 6800, created_at: '2025-03-10T10:00:00Z', updated_at: '2026-01-20T09:00:00Z',
  },
  {
    id: '4', tenant_code: 'TEN-N3T7L5', business_name: 'Noodle House',
    owner_name: 'Li Wei', email: 'li@noodlehouse.com', phone: '+1-555-0104',
    city: 'San Francisco', country: 'USA', status: 'suspended', subscription_plan: 'starter',
    max_pos_devices: 5, monthly_revenue: 4300, created_at: '2025-04-01T10:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },
  {
    id: '5', tenant_code: 'TEN-H2V8J4', business_name: 'The Pizza Hub',
    owner_name: 'Antonio Ferrari', email: 'antonio@pizzahub.com', phone: '+1-555-0105',
    city: 'Miami', country: 'USA', status: 'active', subscription_plan: 'enterprise',
    max_pos_devices: 18, monthly_revenue: 5900, created_at: '2025-04-15T10:00:00Z', updated_at: '2026-02-05T09:00:00Z',
  },
  {
    id: '6', tenant_code: 'TEN-C6B1A9', business_name: 'Café Milano',
    owner_name: 'Giulia Bianchi', email: 'giulia@cafemilano.com', phone: '+1-555-0106',
    city: 'Los Angeles', country: 'USA', status: 'pending', subscription_plan: 'starter',
    max_pos_devices: 3, monthly_revenue: 0, created_at: '2026-02-28T10:00:00Z', updated_at: '2026-02-28T10:00:00Z',
  },
]

const PLANS = ['starter', 'professional', 'enterprise']
const STATUSES = ['active', 'suspended', 'pending']

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(DEMO_TENANTS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const data = await tenantApi.list()
      if (data.length > 0) setTenants(data)
    } catch {
      // Use demo data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTenants() }, [loadTenants])

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch =
      t.business_name.toLowerCase().includes(q) ||
      t.tenant_code.toLowerCase().includes(q) ||
      t.owner_name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchPlan = planFilter === 'all' || t.subscription_plan === planFilter
    return matchSearch && matchStatus && matchPlan
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await tenantApi.softDelete(id)
      setTenants((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tenant deleted successfully')
    } catch {
      setTenants((prev) => prev.filter((t) => t.id !== id))
      toast.success('Tenant removed (demo mode)')
    } finally {
      setDeleting(null)
    }
  }

  const handleStatus = async (tenant: Tenant, newStatus: 'active' | 'suspended') => {
    try {
      if (newStatus === 'suspended') {
        await tenantApi.suspend(tenant.id)
      } else {
        await tenantApi.activate(tenant.id)
      }
      setTenants((prev) => prev.map((t) => t.id === tenant.id ? { ...t, status: newStatus } : t))
      toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}`)
    } catch {
      setTenants((prev) => prev.map((t) => t.id === tenant.id ? { ...t, status: newStatus } : t))
      toast.success(`Tenant ${newStatus === 'active' ? 'activated' : 'suspended'} (demo mode)`)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tenant Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {tenants.length} tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={loadTenants}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button id="add-tenant-btn" className="btn-primary" onClick={() => { setEditingTenant(null); setShowModal(true) }}>
            <Plus size={16} /> Add Tenant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="table-container">
        <div className="table-header">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                id="tenant-search"
                type="text"
                className="form-input text-sm"
                style={{ paddingLeft: '2rem', width: '220px' }}
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              id="status-filter"
              className="form-select text-sm"
              style={{ width: '140px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select
              id="plan-filter"
              className="form-select text-sm"
              style={{ width: '160px' }}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">All Plans</option>
              {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Filter size={13} />
            <span>{filtered.length} results</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Code</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Devices</th>
                <th>Revenue</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
                        {getInitials(tenant.business_name)}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tenant.business_name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tenant.owner_name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{tenant.tenant_code}</code>
                      <button
                        className="btn-icon p-0.5"
                        onClick={() => { copyToClipboard(tenant.tenant_code); toast.success('Copied!') }}
                        title="Copy code"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${tenant.subscription_plan === 'enterprise' ? 'badge-accent' : tenant.subscription_plan === 'professional' ? 'badge-success' : 'badge-muted'}`}>
                      {tenant.subscription_plan}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {tenant.max_pos_devices}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(tenant.monthly_revenue || 0)}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(tenant.created_at)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button id={`view-tenant-${tenant.id}`} className="btn-icon p-1.5" title="View details"
                        onClick={() => setViewTenant(tenant)}>
                        <Eye size={14} />
                      </button>
                      <button id={`edit-tenant-${tenant.id}`} className="btn-icon p-1.5" title="Edit"
                        onClick={() => { setEditingTenant(tenant); setShowModal(true) }}>
                        <Edit2 size={14} />
                      </button>
                      {tenant.status === 'active' ? (
                        <button className="btn-icon p-1.5" title="Suspend"
                          onClick={() => handleStatus(tenant, 'suspended')}>
                          <Ban size={14} style={{ color: 'var(--warning)' }} />
                        </button>
                      ) : (
                        <button className="btn-icon p-1.5" title="Activate"
                          onClick={() => handleStatus(tenant, 'active')}>
                          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                        </button>
                      )}
                      <button id={`delete-tenant-${tenant.id}`} className="btn-icon p-1.5" title="Delete"
                        onClick={() => handleDelete(tenant.id)}>
                        {deleting === tenant.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} style={{ color: 'var(--danger)' }} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Building2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No tenants found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <TenantModal
          tenant={editingTenant}
          onClose={() => setShowModal(false)}
          onSave={(t) => {
            if (editingTenant) {
              setTenants((prev) => prev.map((x) => x.id === t.id ? t : x))
            } else {
              setTenants((prev) => [t, ...prev])
            }
            setShowModal(false)
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewTenant && (
        <TenantDetailModal tenant={viewTenant} onClose={() => setViewTenant(null)} />
      )}
    </div>
  )
}

function TenantModal({ tenant, onClose, onSave }: {
  tenant: Tenant | null
  onClose: () => void
  onSave: (t: Tenant) => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    business_name: tenant?.business_name || '',
    owner_name: tenant?.owner_name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    city: tenant?.city || '',
    country: tenant?.country || 'USA',
    subscription_plan: tenant?.subscription_plan || 'starter',
    max_pos_devices: tenant?.max_pos_devices || 5,
    status: tenant?.status || 'pending',
    notes: tenant?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let result: Tenant
      if (tenant) {
        result = await tenantApi.update(tenant.id, form as Partial<Tenant>)
      } else {
        result = await tenantApi.create(form as Omit<Tenant, 'id' | 'tenant_code' | 'created_at' | 'updated_at'>)
      }
      onSave(result)
      toast.success(tenant ? 'Tenant updated!' : 'Tenant created!')
    } catch {
      // Demo fallback
      const newTenant: Tenant = {
        id: Date.now().toString(),
        tenant_code: generateTenantCode(),
        ...form,
        monthly_revenue: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Tenant
      onSave(tenant ? { ...tenant, ...form, updated_at: new Date().toISOString() } : newTenant)
      toast.success(tenant ? 'Tenant updated (demo)!' : 'Tenant created (demo)!')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {tenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Business Name *</label>
                <input id="business-name-input" className="form-input" value={form.business_name}
                  onChange={(e) => set('business_name', e.target.value)} required placeholder="Café Milano" />
              </div>
              <div>
                <label className="form-label">Owner Name *</label>
                <input id="owner-name-input" className="form-input" value={form.owner_name}
                  onChange={(e) => set('owner_name', e.target.value)} required placeholder="John Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email *</label>
                <input type="email" id="tenant-email-input" className="form-input" value={form.email}
                  onChange={(e) => set('email', e.target.value)} required placeholder="owner@business.com" />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input id="tenant-phone-input" className="form-input" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">City</label>
                <input className="form-input" value={form.city}
                  onChange={(e) => set('city', e.target.value)} placeholder="New York" />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country}
                  onChange={(e) => set('country', e.target.value)} placeholder="USA" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Subscription Plan</label>
                <select id="subscription-plan-select" className="form-select" value={form.subscription_plan}
                  onChange={(e) => set('subscription_plan', e.target.value)}>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="form-label">Max POS Devices</label>
                <input type="number" className="form-input" value={form.max_pos_devices} min={1} max={100}
                  onChange={(e) => set('max_pos_devices', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={form.notes}
                onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-tenant-btn" type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <>{tenant ? 'Update' : 'Create'} Tenant</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TenantDetailModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              {getInitials(tenant.business_name)}
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{tenant.business_name}</h2>
              <code className="text-xs" style={{ color: 'var(--accent)' }}>{tenant.tenant_code}</code>
            </div>
          </div>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Owner', tenant.owner_name], ['Email', tenant.email],
              ['Phone', tenant.phone || 'N/A'], ['Location', `${tenant.city || ''}, ${tenant.country || ''}`],
              ['Plan', tenant.subscription_plan], ['Status', tenant.status],
              ['Max Devices', tenant.max_pos_devices.toString()], ['Revenue', formatCurrency(tenant.monthly_revenue || 0)],
              ['Created', formatDate(tenant.created_at)], ['Updated', formatDate(tenant.updated_at)],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
          {tenant.notes && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{tenant.notes}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
