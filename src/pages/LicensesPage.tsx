import React, { useState, useCallback } from 'react'
import { Plus, Search, Copy, RefreshCw, X, Loader2, Key, ShieldOff, ShieldCheck, Eye } from 'lucide-react'
import { licenseApi } from '@/lib/api'
import { generateLicenseKey, formatDate, getStatusBadgeClass, copyToClipboard, daysUntilExpiry, formatRelativeTime } from '@/lib/utils'
import type { License } from '@/types/database'
import toast from 'react-hot-toast'

const DEMO_LICENSES: License[] = [
  {
    id: 'L1', tenant_id: '1', license_key: 'P8X2-K3AB-7MNQ-R4ST',
    product_name: 'POS Enterprise Suite', status: 'active', max_activations: 20,
    current_activations: 12, issued_at: '2025-01-15T10:00:00Z',
    expires_at: '2027-01-15T10:00:00Z', features: ['offline_mode', 'multi_terminal', 'analytics', 'inventory'],
    created_at: '2025-01-15T10:00:00Z', updated_at: '2026-01-10T09:00:00Z',
    tenant: { business_name: 'Portobello Bistro', tenant_code: 'TEN-P8X2K3' } as License['tenant'],
  },
  {
    id: 'L2', tenant_id: '2', license_key: 'S7Y4-M1CD-8ZPQ-V5UV',
    product_name: 'POS Pro Suite', status: 'active', max_activations: 15,
    current_activations: 9, issued_at: '2025-02-20T10:00:00Z',
    expires_at: '2026-03-15T10:00:00Z', features: ['offline_mode', 'multi_terminal', 'analytics'],
    created_at: '2025-02-20T10:00:00Z', updated_at: '2026-01-15T09:00:00Z',
    tenant: { business_name: 'Sunrise Café Chain', tenant_code: 'TEN-S7Y4M1' } as License['tenant'],
  },
  {
    id: 'L3', tenant_id: '3', license_key: 'M5R9-Q6EF-2YRS-W7XY',
    product_name: 'POS Professional', status: 'active', max_activations: 12,
    current_activations: 8, issued_at: '2025-03-10T10:00:00Z',
    expires_at: '2027-03-10T10:00:00Z', features: ['offline_mode', 'analytics'],
    created_at: '2025-03-10T10:00:00Z', updated_at: '2026-01-20T09:00:00Z',
    tenant: { business_name: 'Metro Burger Co.', tenant_code: 'TEN-M5R9Q6' } as License['tenant'],
  },
  {
    id: 'L4', tenant_id: '4', license_key: 'N3T7-L5GH-9ABS-A8ZA',
    product_name: 'POS Starter', status: 'expired', max_activations: 5,
    current_activations: 5, issued_at: '2024-04-01T10:00:00Z',
    expires_at: '2025-04-01T10:00:00Z', features: ['offline_mode'],
    created_at: '2024-04-01T10:00:00Z', updated_at: '2025-04-02T09:00:00Z',
    tenant: { business_name: 'Noodle House', tenant_code: 'TEN-N3T7L5' } as License['tenant'],
  },
  {
    id: 'L5', tenant_id: '5', license_key: 'H2V8-J4IJ-3CTU-B9BC',
    product_name: 'POS Enterprise Suite', status: 'active', max_activations: 18,
    current_activations: 7, issued_at: '2025-04-15T10:00:00Z',
    expires_at: '2026-04-10T10:00:00Z', features: ['offline_mode', 'multi_terminal', 'analytics', 'inventory'],
    created_at: '2025-04-15T10:00:00Z', updated_at: '2026-02-05T09:00:00Z',
    tenant: { business_name: 'The Pizza Hub', tenant_code: 'TEN-H2V8J4' } as License['tenant'],
  },
]

const TENANT_OPTIONS = [
  { id: '1', name: 'Portobello Bistro' },
  { id: '2', name: 'Sunrise Café Chain' },
  { id: '3', name: 'Metro Burger Co.' },
  { id: '4', name: 'Noodle House' },
  { id: '5', name: 'The Pizza Hub' },
]

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>(DEMO_LICENSES)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [viewLicense, setViewLicense] = useState<License | null>(null)
  const [showVerify, setShowVerify] = useState(false)

  const filtered = licenses.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch =
      l.license_key.toLowerCase().includes(q) ||
      l.product_name.toLowerCase().includes(q) ||
      (l.tenant as License['tenant'] & { business_name?: string })?.business_name?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this license? The tenant will lose access.')) return
    try {
      await licenseApi.revoke(id)
    } catch { /* demo */ }
    setLicenses((prev) => prev.map((l) => l.id === id ? { ...l, status: 'revoked' } : l))
    toast.success('License revoked')
  }

  const handleActivate = async (id: string) => {
    try {
      await licenseApi.activate(id)
    } catch { /* demo */ }
    setLicenses((prev) => prev.map((l) => l.id === id ? { ...l, status: 'active' } : l))
    toast.success('License activated')
  }

  const getDaysClass = (expires: string, status: string) => {
    if (status !== 'active') return 'text-muted'
    const days = daysUntilExpiry(expires)
    if (days < 0) return 'text-danger'
    if (days <= 7) return 'text-warning'
    if (days <= 30) return 'text-info'
    return 'text-success'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">License Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {licenses.length} licenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowVerify(true)}>
            <ShieldCheck size={15} /> Verify License
          </button>
          <button id="generate-license-btn" className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Generate License
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: licenses.length, color: 'var(--accent)' },
          { label: 'Active', value: licenses.filter(l => l.status === 'active').length, color: 'var(--success)' },
          { label: 'Expired', value: licenses.filter(l => l.status === 'expired').length, color: 'var(--danger)' },
          { label: 'Expiring Soon (7d)', value: licenses.filter(l => l.status === 'active' && daysUntilExpiry(l.expires_at) <= 7 && daysUntilExpiry(l.expires_at) > 0).length, color: 'var(--warning)' },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                id="license-search"
                type="text" className="form-input text-sm" style={{ paddingLeft: '2rem', width: '220px' }}
                placeholder="Search licenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select id="license-status-filter" className="form-select text-sm" style={{ width: '140px' }}
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>License Key</th>
                <th>Tenant</th>
                <th>Product</th>
                <th>Status</th>
                <th>Activations</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lic) => {
                const days = daysUntilExpiry(lic.expires_at)
                const tenantData = lic.tenant as (License['tenant'] & { business_name?: string; tenant_code?: string }) | undefined
                return (
                  <tr key={lic.id}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{lic.license_key}</code>
                        <button className="btn-icon p-0.5"
                          onClick={() => { copyToClipboard(lic.license_key); toast.success('Copied!') }}>
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{tenantData?.business_name || 'N/A'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tenantData?.tenant_code || ''}</p>
                    </td>
                    <td>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lic.product_name}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(lic.status)}`}>{lic.status}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {lic.current_activations}/{lic.max_activations}
                        </p>
                        <div className="w-20 h-1.5 rounded-full mt-1" style={{ background: 'var(--border)' }}>
                          <div className="h-1.5 rounded-full"
                            style={{
                              width: `${(lic.current_activations / lic.max_activations) * 100}%`,
                              background: lic.current_activations >= lic.max_activations ? 'var(--danger)' : 'var(--success)'
                            }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(lic.expires_at)}</p>
                        {lic.status === 'active' && (
                          <p className={`text-xs font-semibold ${getDaysClass(lic.expires_at, lic.status)}`}>
                            {days < 0 ? 'Expired' : `${days}d left`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-icon p-1.5" title="View" onClick={() => setViewLicense(lic)}>
                          <Eye size={14} />
                        </button>
                        {lic.status === 'active' ? (
                          <button id={`revoke-${lic.id}`} className="btn-icon p-1.5" title="Revoke" onClick={() => handleRevoke(lic.id)}>
                            <ShieldOff size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        ) : (
                          <button id={`activate-${lic.id}`} className="btn-icon p-1.5" title="Activate" onClick={() => handleActivate(lic.id)}>
                            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Key size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No licenses found</p>
            </div>
          )}
        </div>
      </div>

      {/* Generate License Modal */}
      {showModal && (
        <GenerateLicenseModal
          onClose={() => setShowModal(false)}
          onGenerate={(lic) => {
            setLicenses((prev) => [lic, ...prev])
            setShowModal(false)
            toast.success('License generated successfully!')
          }}
        />
      )}

      {/* View License Modal */}
      {viewLicense && (
        <LicenseDetailModal license={viewLicense} onClose={() => setViewLicense(null)} />
      )}

      {/* Verify Modal */}
      {showVerify && <VerifyLicenseModal onClose={() => setShowVerify(false)} />}
    </div>
  )
}

function GenerateLicenseModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (l: License) => void }) {
  const [form, setForm] = useState({
    tenant_id: '1',
    product_name: 'POS Professional',
    max_activations: 10,
    expires_at: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    features: ['offline_mode', 'analytics'] as string[],
  })
  const [generatedKey, setGeneratedKey] = useState(generateLicenseKey())
  const [saving, setSaving] = useState(false)

  const featureOptions = ['offline_mode', 'analytics', 'multi_terminal', 'inventory', 'reports', 'api_access']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const lic = await licenseApi.generate({ ...form, expires_at: form.expires_at + 'T00:00:00Z' })
      onGenerate(lic)
    } catch {
      const demoLic: License = {
        id: Date.now().toString(),
        ...form,
        license_key: generatedKey,
        status: 'active',
        current_activations: 0,
        issued_at: new Date().toISOString(),
        expires_at: form.expires_at + 'T00:00:00Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tenant: TENANT_OPTIONS.find(t => t.id === form.tenant_id) as License['tenant'],
      }
      onGenerate(demoLic)
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Generate License Key</h2>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {/* Preview key */}
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>LICENSE KEY PREVIEW</p>
              <code className="text-xl font-mono font-bold" style={{ color: 'var(--accent)', letterSpacing: '0.1em' }}>{generatedKey}</code>
              <button type="button" className="btn-icon p-1 mt-2 mx-auto block" onClick={() => setGeneratedKey(generateLicenseKey())} title="Regenerate">
                <RefreshCw size={12} />
              </button>
            </div>

            <div>
              <label className="form-label">Tenant</label>
              <select id="license-tenant-select" className="form-select" value={form.tenant_id} onChange={(e) => set('tenant_id', e.target.value)} required>
                {TENANT_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Product Name</label>
              <input className="form-input" value={form.product_name} onChange={(e) => set('product_name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Max Activations</label>
                <input type="number" className="form-input" value={form.max_activations} min={1} max={100}
                  onChange={(e) => set('max_activations', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={form.expires_at}
                  onChange={(e) => set('expires_at', e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="form-label">Features</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {featureOptions.map((f) => (
                  <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="rounded"
                      checked={form.features.includes(f)}
                      onChange={(e) => {
                        set('features', e.target.checked
                          ? [...form.features, f]
                          : form.features.filter(x => x !== f))
                      }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button id="generate-license-submit" type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Key size={14} /> Generate License</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LicenseDetailModal({ license, onClose }: { license: License; onClose: () => void }) {
  const tenantData = license.tenant as (License['tenant'] & { business_name?: string; tenant_code?: string }) | undefined
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>License Details</h2>
            <code className="text-xs" style={{ color: 'var(--accent)' }}>{license.license_key}</code>
          </div>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Tenant', tenantData?.business_name || 'N/A'],
              ['Product', license.product_name],
              ['Status', license.status],
              ['Activations', `${license.current_activations}/${license.max_activations}`],
              ['Issued', formatDate(license.issued_at)],
              ['Expires', formatDate(license.expires_at)],
              ['Days Left', `${daysUntilExpiry(license.expires_at)}d`],
              ['Last Checked', license.last_checked_at ? formatRelativeTime(license.last_checked_at) : 'Never'],
            ].map(([l, v]) => (
              <div key={l} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{l}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>{v}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Features</p>
            <div className="flex flex-wrap gap-2">
              {license.features.map((f) => (
                <span key={f} className="badge badge-accent text-xs capitalize">{f.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={() => { copyToClipboard(license.license_key); toast.success('Key copied!') }}>
            <Copy size={14} /> Copy Key
          </button>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function VerifyLicenseModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState('')
  const [hwId, setHwId] = useState('')
  const [result, setResult] = useState<{ valid: boolean; reason?: string; license?: License } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await licenseApi.verify(key, hwId)
      setResult(res as { valid: boolean; reason?: string; license?: License })
    } catch {
      const found = DEMO_LICENSES.find(l => l.license_key === key)
      if (found) {
        setResult({ valid: found.status === 'active', license: found, reason: found.status !== 'active' ? `License is ${found.status}` : undefined })
      } else {
        setResult({ valid: false, reason: 'License key not found' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>POS License Verification</h2>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleVerify}>
          <div className="modal-body space-y-4">
            <div>
              <label className="form-label">License Key</label>
              <input id="verify-key-input" className="form-input font-mono" placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key} onChange={(e) => setKey(e.target.value.toUpperCase())} required />
            </div>
            <div>
              <label className="form-label">Hardware ID (optional)</label>
              <input id="verify-hw-input" className="form-input font-mono" placeholder="HW-XXXXXXXXXXXX"
                value={hwId} onChange={(e) => setHwId(e.target.value.toUpperCase())} />
            </div>

            {result && (
              <div className="p-4 rounded-xl" style={{
                background: result.valid ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1px solid ${result.valid ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              }}>
                <div className="flex items-center gap-2 mb-2">
                  {result.valid ? <ShieldCheck size={18} style={{ color: 'var(--success)' }} /> : <ShieldOff size={18} style={{ color: 'var(--danger)' }} />}
                  <span className="font-bold" style={{ color: result.valid ? 'var(--success)' : 'var(--danger)' }}>
                    {result.valid ? '✓ License Valid' : '✗ License Invalid'}
                  </span>
                </div>
                {result.reason && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{result.reason}</p>}
                {result.valid && result.license && (
                  <div className="mt-3 space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p>Product: <strong>{result.license.product_name}</strong></p>
                    <p>Expires: <strong>{formatDate(result.license.expires_at)}</strong></p>
                    <p>Features: <strong>{result.license.features.join(', ')}</strong></p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button id="verify-license-btn" type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : <><ShieldCheck size={14} /> Verify License</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
