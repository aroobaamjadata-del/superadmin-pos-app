import { useState } from 'react'
import { FileText, Search, Filter, RefreshCw, Download } from 'lucide-react'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { downloadJSON } from '@/lib/utils'

const DEMO_LOGS = [
  { id: '1', action: 'CREATE', resource_type: 'tenant', resource_id: '1', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { business_name: 'Portobello Bistro' }, created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '2', action: 'GENERATE', resource_type: 'license', resource_id: 'L1', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { license_key: 'P8X2-K3AB-7MNQ-R4ST', tenant_id: '1' }, created_at: new Date(Date.now() - 3600000 * 2.1).toISOString() },
  { id: '3', action: 'UPDATE', resource_type: 'tenant', resource_id: '2', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { subscription_plan: 'professional' }, created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '4', action: 'SUSPEND', resource_type: 'tenant', resource_id: '4', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: {}, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', action: 'REVOKE', resource_type: 'license', resource_id: 'L4', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: {}, created_at: new Date(Date.now() - 86400000 * 1.5).toISOString() },
  { id: '6', action: 'REGISTER', resource_type: 'pos_device', resource_id: 'D1', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { device_name: 'Main Counter POS' }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '7', action: 'ACTIVATE', resource_type: 'license', resource_id: 'L2', user_email: 'admin@portobello.com', ip_address: '192.168.1.10', details: {}, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: '8', action: 'DELETE', resource_type: 'tenant', resource_id: '7', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { reason: 'Contract terminated' }, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '9', action: 'SUSPEND', resource_type: 'pos_device', resource_id: 'D5', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: {}, created_at: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: '10', action: 'CREATE', resource_type: 'tenant', resource_id: '5', user_email: 'superadmin@demo.com', ip_address: '203.0.113.1', details: { business_name: 'The Pizza Hub' }, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
]

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-danger',
  SUSPEND: 'badge-warning',
  ACTIVATE: 'badge-success',
  REVOKE: 'badge-danger',
  REGISTER: 'badge-accent',
  GENERATE: 'badge-accent',
}

export default function AuditLogsPage() {
  const [logs] = useState(DEMO_LOGS)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    const match = l.action.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q) ||
      l.user_email.toLowerCase().includes(q) ||
      l.ip_address.toLowerCase().includes(q)
    return match &&
      (actionFilter === 'all' || l.action === actionFilter) &&
      (resourceFilter === 'all' || l.resource_type === resourceFilter)
  })

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)))
  const uniqueTypes = Array.from(new Set(logs.map(l => l.resource_type)))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Complete history of all admin actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => downloadJSON(filtered, `audit-logs-${Date.now()}.json`)}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" className="form-input text-sm" style={{ paddingLeft: '2rem', width: '200px' }}
                placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select text-sm" style={{ width: '140px' }}
              value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="all">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="form-select text-sm" style={{ width: '150px' }}
              value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
              <option value="all">All Resources</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Filter size={13} />
            <span>{filtered.length} entries</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`badge ${ACTION_COLORS[log.action] || 'badge-muted'}`}>{log.action}</span>
                  </td>
                  <td>
                    <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {log.resource_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <code className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.resource_id}
                    </code>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{log.user_email}</span>
                  </td>
                  <td>
                    <code className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.ip_address}</code>
                  </td>
                  <td>
                    {Object.keys(log.details).length > 0 ? (
                      <code className="text-xs font-mono" style={{ color: 'var(--text-muted)', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {JSON.stringify(log.details)}
                      </code>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{formatRelativeTime(log.created_at)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(log.created_at)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No audit logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
