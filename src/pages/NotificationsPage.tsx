import { useState } from 'react'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

const DEMO_NOTIFS = [
  { id: '1', title: 'License Expiring Soon', message: '8 licenses are expiring in the next 7 days. Review and renew them to avoid service disruption.', type: 'warning' as const, is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', title: 'New Tenant Registered', message: 'Café Milano has been registered and is awaiting activation. Please review and approve.', type: 'success' as const, is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', title: 'POS Device Offline', message: 'POS-Terminal-07 at Metro Burger Co. has been offline for 2 hours. Check network connectivity.', type: 'error' as const, is_read: false, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: '4', title: 'Monthly Report Ready', message: 'February 2026 revenue report is now available. Total revenue: $48,750 across 47 tenants.', type: 'info' as const, is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', title: 'License Renewed', message: 'License for Portobello Bistro (TEN-P8X2K3) has been successfully renewed for 1 year.', type: 'success' as const, is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '6', title: 'Tenant Suspended', message: 'Noodle House (TEN-N3T7L5) has been suspended due to overdue payment. All POS devices are locked.', type: 'warning' as const, is_read: true, created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '7', title: 'Security Alert', message: 'Multiple failed login attempts detected from IP 198.51.100.42. Auto-blocked for 24 hours.', type: 'error' as const, is_read: true, created_at: new Date(Date.now() - 345600000).toISOString() },
]

const typeIcon = {
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
}

const typeColors = {
  info: { bg: 'var(--info-light)', color: 'var(--info)' },
  warning: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  success: { bg: 'var(--success-light)', color: 'var(--success)' },
  error: { bg: 'var(--danger-light)', color: 'var(--danger)' },
}

export default function NotificationsPage() {
  const { notifications: storeNotifs, markAllAsRead, unreadCount } = useAppStore()
  const [filter, setFilter] = useState('all')
  const [notifs, setNotifs] = useState(DEMO_NOTIFS)

  const displayNotifs = notifs
  const filtered = displayNotifs.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.is_read : n.type === filter
  )

  const handleMarkRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const handleDelete = (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
    markAllAsRead()
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {unread} unread · {notifs.length} total
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'unread', 'warning', 'error', 'success', 'info'].map((f) => (
          <button
            key={f}
            className={`btn-secondary text-xs px-3 py-1.5 capitalize`}
            style={filter === f ? { background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${notifs.length})` :
              f === 'unread' ? `Unread (${unread})` :
                `${f.charAt(0).toUpperCase() + f.slice(1)} (${notifs.filter(n => n.type === f).length})`}
          </button>
        ))}
      </div>

      {/* Notification cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Bell size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No notifications</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>You're all caught up!</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className="card flex gap-4 transition-all cursor-pointer"
              style={{ borderColor: !n.is_read ? 'var(--accent)' : 'var(--border)', opacity: n.is_read ? 0.7 : 1 }}
              onClick={() => handleMarkRead(n.id)}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: typeColors[n.type].bg, color: typeColors[n.type].color }}>
                {typeIcon[n.type]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(n.created_at)}</span>
                    <button className="btn-icon p-1" onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge text-xs ${
                    n.type === 'warning' ? 'badge-warning' :
                    n.type === 'error' ? 'badge-danger' :
                    n.type === 'success' ? 'badge-success' : 'badge-info'
                  }`}>
                    {n.type}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
