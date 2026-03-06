import { useEffect, useRef } from 'react'
import { X, Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { formatRelativeTime } from '@/lib/utils'

interface Props {
  onClose: () => void
}

const typeIcon = {
  info: <Info size={14} style={{ color: 'var(--info)' }} />,
  warning: <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />,
  success: <CheckCircle size={14} style={{ color: 'var(--success)' }} />,
  error: <XCircle size={14} style={{ color: 'var(--danger)' }} />,
}

export default function NotificationPanel({ onClose }: Props) {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const displayNotifications = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl overflow-hidden animate-slide-up z-50"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        maxHeight: '480px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-accent text-xs">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={markAllAsRead}
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          <button className="btn-icon p-1" onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
        {displayNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</p>
          </div>
        ) : (
          displayNotifications.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
              style={{
                background: !n.is_read ? 'var(--accent-light)' : 'transparent',
                borderColor: 'var(--border)',
              }}
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: 'var(--bg-hover)' }}>
                {typeIcon[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent)' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const DEMO_NOTIFICATIONS = [
  {
    id: '1', title: 'License Expiring Soon', is_read: false, type: 'warning' as const,
    message: '8 licenses are expiring in the next 7 days. Review and renew them.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2', title: 'New Tenant Registered', is_read: false, type: 'success' as const,
    message: 'Café Milano has been registered and is pending activation.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3', title: 'POS Device Offline', is_read: true, type: 'error' as const,
    message: 'POS-Terminal-07 at Burger House has been offline for 2 hours.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4', title: 'Monthly Report Ready', is_read: true, type: 'info' as const,
    message: 'February 2026 revenue report is ready for download.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
]
