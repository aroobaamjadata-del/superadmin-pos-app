import { useState } from 'react'
import { Monitor, Search, Plus, Trash2, Ban, RefreshCw, Wifi, WifiOff, X, Loader2, AlertCircle } from 'lucide-react'
import { posDeviceApi } from '@/lib/api'
import { formatDate, formatRelativeTime, getStatusBadgeClass, generateHardwareId, getInitials } from '@/lib/utils'
import type { POSDevice } from '@/types/database'
import toast from 'react-hot-toast'

const DEMO_DEVICES: POSDevice[] = [
  { id: 'D1', tenant_id: '1', device_name: 'Main Counter POS', hardware_id: 'HW-PORTO001MAIN', license_id: 'L1', status: 'online', last_seen_at: new Date(Date.now() - 300000).toISOString(), ip_address: '192.168.1.100', os_version: 'Windows 11', app_version: '2.4.1', location: 'Counter 1', offline_checkins: 0, created_at: '2025-01-20T10:00:00Z', updated_at: '2026-03-01T09:00:00Z', tenant: { business_name: 'Portobello Bistro', tenant_code: 'TEN-P8X2K3' } as POSDevice['tenant'], license: { license_key: 'P8X2-K3AB-7MNQ-R4ST', status: 'active' } as POSDevice['license'] },
  { id: 'D2', tenant_id: '1', device_name: 'Bar Terminal', hardware_id: 'HW-PORTO002BAR', license_id: 'L1', status: 'online', last_seen_at: new Date(Date.now() - 600000).toISOString(), ip_address: '192.168.1.101', os_version: 'Windows 11', app_version: '2.4.1', location: 'Bar Area', offline_checkins: 2, created_at: '2025-01-20T10:00:00Z', updated_at: '2026-03-01T09:00:00Z', tenant: { business_name: 'Portobello Bistro', tenant_code: 'TEN-P8X2K3' } as POSDevice['tenant'], license: { license_key: 'P8X2-K3AB-7MNQ-R4ST', status: 'active' } as POSDevice['license'] },
  { id: 'D3', tenant_id: '2', device_name: 'Sunrise Terminal 01', hardware_id: 'HW-SUNR001TERM', license_id: 'L2', status: 'online', last_seen_at: new Date(Date.now() - 120000).toISOString(), ip_address: '10.0.0.50', os_version: 'Windows 10', app_version: '2.3.8', location: 'Store #1', offline_checkins: 0, created_at: '2025-03-01T10:00:00Z', updated_at: '2026-03-01T09:00:00Z', tenant: { business_name: 'Sunrise Café Chain', tenant_code: 'TEN-S7Y4M1' } as POSDevice['tenant'], license: { license_key: 'S7Y4-M1CD-8ZPQ-V5UV', status: 'active' } as POSDevice['license'] },
  { id: 'D4', tenant_id: '3', device_name: 'Metro Main POS', hardware_id: 'HW-METR001MAIN', license_id: 'L3', status: 'offline', last_seen_at: new Date(Date.now() - 7200000).toISOString(), ip_address: '172.16.0.22', os_version: 'Windows 11', app_version: '2.4.0', location: 'Front Desk', offline_checkins: 5, created_at: '2025-03-15T10:00:00Z', updated_at: '2026-03-01T09:00:00Z', tenant: { business_name: 'Metro Burger Co.', tenant_code: 'TEN-M5R9Q6' } as POSDevice['tenant'], license: { license_key: 'M5R9-Q6EF-2YRS-W7XY', status: 'active' } as POSDevice['license'] },
  { id: 'D5', tenant_id: '4', device_name: 'Noodle POS', hardware_id: 'HW-NOOD001MAIN', license_id: 'L4', status: 'suspended', last_seen_at: new Date(Date.now() - 86400000 * 3).toISOString(), ip_address: '192.168.2.5', os_version: 'Windows 10', app_version: '2.1.0', location: 'Kitchen', offline_checkins: 12, created_at: '2024-05-01T10:00:00Z', updated_at: '2026-02-01T09:00:00Z', tenant: { business_name: 'Noodle House', tenant_code: 'TEN-N3T7L5' } as POSDevice['tenant'], license: { license_key: 'N3T7-L5GH-9ABS-A8ZA', status: 'expired' } as POSDevice['license'] },
  { id: 'D6', tenant_id: '5', device_name: 'Pizza Hub Terminal A', hardware_id: 'HW-PIZZ001TERA', license_id: 'L5', status: 'online', last_seen_at: new Date(Date.now() - 60000).toISOString(), ip_address: '10.10.0.15', os_version: 'Windows 11', app_version: '2.4.1', location: 'Counter A', offline_checkins: 1, created_at: '2025-05-01T10:00:00Z', updated_at: '2026-03-01T09:00:00Z', tenant: { business_name: 'The Pizza Hub', tenant_code: 'TEN-H2V8J4' } as POSDevice['tenant'], license: { license_key: 'H2V8-J4IJ-3CTU-B9BC', status: 'active' } as POSDevice['license'] },
]

export default function POSDevicesPage() {
  const [devices, setDevices] = useState<POSDevice[]>(DEMO_DEVICES)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [checkInModal, setCheckInModal] = useState<POSDevice | null>(null)

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase()
    const tenant = d.tenant as (POSDevice['tenant'] & { business_name?: string }) | undefined
    const match = d.device_name.toLowerCase().includes(q) ||
      d.hardware_id.toLowerCase().includes(q) ||
      (tenant?.business_name || '').toLowerCase().includes(q) ||
      (d.location || '').toLowerCase().includes(q)
    return match && (statusFilter === 'all' || d.status === statusFilter)
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this POS device?')) return
    try { await posDeviceApi.delete(id) } catch { /* demo */ }
    setDevices((prev) => prev.filter((d) => d.id !== id))
    toast.success('Device removed')
  }

  const handleSuspend = async (id: string) => {
    try { await posDeviceApi.suspend(id) } catch { /* demo */ }
    setDevices((prev) => prev.map((d) => d.id === id ? { ...d, status: 'suspended' as const } : d))
    toast.success('Device suspended')
  }

  const handleCheckIn = async (device: POSDevice, online: boolean) => {
    try { await posDeviceApi.checkIn(device.hardware_id, online) } catch { /* demo */ }
    setDevices((prev) => prev.map((d) => d.id === device.id ? {
      ...d,
      status: online ? 'online' as const : 'offline' as const,
      last_seen_at: new Date().toISOString(),
      offline_checkins: online ? d.offline_checkins : d.offline_checkins + 1,
    } : d))
    toast.success(`Device checked in as ${online ? 'online' : 'offline'}`)
    setCheckInModal(null)
  }

  const statusDot = (status: string) => {
    const colors: Record<string, string> = { online: 'var(--success)', offline: 'var(--text-muted)', suspended: 'var(--warning)' }
    return (
      <span className="inline-block w-2 h-2 rounded-full" style={{ background: colors[status] || 'var(--border)', boxShadow: status === 'online' ? `0 0 6px ${colors.online}` : 'none' }} />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">POS Devices</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{filtered.length} devices</p>
        </div>
        <button id="register-device-btn" className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Register Device
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online', value: devices.filter(d => d.status === 'online').length, color: 'var(--success)', icon: Wifi },
          { label: 'Offline', value: devices.filter(d => d.status === 'offline').length, color: 'var(--text-muted)', icon: WifiOff },
          { label: 'Suspended', value: devices.filter(d => d.status === 'suspended').length, color: 'var(--warning)', icon: Ban },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}22` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" className="form-input text-sm" style={{ paddingLeft: '2rem', width: '220px' }}
                placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select text-sm" style={{ width: '140px' }}
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>License</th>
                <th>Last Seen</th>
                <th>Offline Check-ins</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((device) => {
                const tenant = device.tenant as (POSDevice['tenant'] & { business_name?: string; tenant_code?: string }) | undefined
                const license = device.license as (POSDevice['license'] & { license_key?: string; status?: string }) | undefined
                return (
                  <tr key={device.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--bg-hover)' }}>
                          <Monitor size={16} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{device.device_name}</p>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{device.hardware_id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{tenant?.business_name || 'N/A'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{device.location}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {statusDot(device.status)}
                        <span className={`badge ${getStatusBadgeClass(device.status)}`}>{device.status}</span>
                      </div>
                    </td>
                    <td>
                      {license?.license_key ? (
                        <code className="text-xs font-mono" style={{ color: 'var(--accent)' }}>
                          {license.license_key.split('-').slice(0, 2).join('-')}…
                        </code>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {device.last_seen_at ? formatRelativeTime(device.last_seen_at) : 'Never'}
                      </p>
                    </td>
                    <td>
                      {device.offline_checkins > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle size={13} style={{ color: 'var(--warning)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>{device.offline_checkins}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-icon p-1.5" title="Simulate Check-in"
                          onClick={() => setCheckInModal(device)}>
                          <RefreshCw size={14} />
                        </button>
                        {device.status !== 'suspended' && (
                          <button className="btn-icon p-1.5" title="Suspend"
                            onClick={() => handleSuspend(device.id)}>
                            <Ban size={14} style={{ color: 'var(--warning)' }} />
                          </button>
                        )}
                        <button className="btn-icon p-1.5" title="Remove"
                          onClick={() => handleDelete(device.id)}>
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Monitor size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No devices found</p>
            </div>
          )}
        </div>
      </div>

      {/* Register Device Modal */}
      {showModal && (
        <RegisterDeviceModal
          onClose={() => setShowModal(false)}
          onRegister={(d) => {
            setDevices((prev) => [d, ...prev])
            setShowModal(false)
            toast.success('Device registered!')
          }}
        />
      )}

      {/* Check-in Modal */}
      {checkInModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCheckInModal(null)}>
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>POS Check-In</h2>
              <button className="btn-icon p-1" onClick={() => setCheckInModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Simulate a check-in for <strong>{checkInModal.device_name}</strong>. 
                Choose connection mode:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-success py-3 flex-col text-center justify-center"
                  onClick={() => handleCheckIn(checkInModal, true)}>
                  <Wifi size={24} className="mb-1" />
                  Online Check-in
                </button>
                <button className="btn-secondary py-3 flex-col text-center justify-center"
                  onClick={() => handleCheckIn(checkInModal, false)}>
                  <WifiOff size={24} className="mb-1" />
                  Offline Check-in
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Offline check-ins are synced when the device comes back online.
                Current offline check-ins: <strong>{checkInModal.offline_checkins}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RegisterDeviceModal({ onClose, onRegister }: {
  onClose: () => void
  onRegister: (d: POSDevice) => void
}) {
  const [form, setForm] = useState({
    device_name: '',
    tenant_id: '1',
    license_id: 'L1',
    location: '',
    os_version: 'Windows 11',
    app_version: '2.4.1',
    ip_address: '',
  })
  const [hwId] = useState(generateHardwareId())
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const device: POSDevice = {
      id: Date.now().toString(),
      hardware_id: hwId,
      status: 'offline',
      offline_checkins: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...form,
    }
    try {
      const registered = await posDeviceApi.register(device)
      onRegister(registered)
    } catch {
      onRegister(device)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Register POS Device</h2>
          <button className="btn-icon p-1" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-secondary)' }}>
              <Monitor size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-Generated Hardware ID</p>
                <code className="text-sm font-mono" style={{ color: 'var(--accent)' }}>{hwId}</code>
              </div>
            </div>
            <div>
              <label className="form-label">Device Name *</label>
              <input id="device-name-input" className="form-input" placeholder="Counter Terminal 1"
                value={form.device_name} onChange={(e) => set('device_name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Main Counter"
                  value={form.location} onChange={(e) => set('location', e.target.value)} />
              </div>
              <div>
                <label className="form-label">IP Address</label>
                <input className="form-input font-mono" placeholder="192.168.1.100"
                  value={form.ip_address} onChange={(e) => set('ip_address', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">OS Version</label>
                <input className="form-input" value={form.os_version}
                  onChange={(e) => set('os_version', e.target.value)} />
              </div>
              <div>
                <label className="form-label">App Version</label>
                <input className="form-input" value={form.app_version}
                  onChange={(e) => set('app_version', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button id="register-device-submit" type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Registering...</> : <><Monitor size={14} /> Register Device</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
