import { useState } from 'react'
import { User, Shield, Bell, Server, Key, Eye, EyeOff, Save, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getInitials } from '@/lib/utils'
import type { AdminUser } from '@/types/database'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'security' | 'notifications' | 'system'

export default function SettingsPage() {
  const { user, theme, toggleTheme } = useAppStore()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Server },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account and system preferences</p>
      </div>

      <div className="flex gap-6 flex-wrap md:flex-nowrap">
        {/* Sidebar */}
        <div className="w-full md:w-52 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`settings-tab-${id}`}
                className={`sidebar-item w-full text-left ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'system' && <SystemTab theme={theme} toggleTheme={toggleTheme} />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ user }: { user: AdminUser | null }) {
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [saving, setSaving] = useState(false)

  return (
    <div className="card">
      <h2 className="section-title mb-6">Profile Information</h2>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
          {getInitials(user?.full_name || 'SA')}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.role?.replace('_', ' ')}</p>
          <span className="badge badge-accent text-xs mt-1">Super Admin</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.full_name}
            onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Role</label>
          <input className="form-input" value="Super Administrator" disabled
            style={{ opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
        <button id="save-profile-btn" className="btn-primary" disabled={saving}
          onClick={async () => {
            setSaving(true)
            await new Promise(r => setTimeout(r, 1000))
            setSaving(false)
            toast.success('Profile updated!')
          }}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}

function SecurityTab() {
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ current: '', new_pass: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title mb-4">Change Password</h2>
        <div className="space-y-4">
          {[
            { key: 'current', label: 'Current Password', placeholder: '••••••••' },
            { key: 'new_pass', label: 'New Password', placeholder: '••••••••' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}

          <button id="change-password-btn" className="btn-primary" disabled={saving}
            onClick={async () => {
              if (form.new_pass !== form.confirm) { toast.error('Passwords do not match'); return }
              setSaving(true)
              await new Promise(r => setTimeout(r, 1000))
              setSaving(false)
              toast.success('Password updated!')
              setForm({ current: '', new_pass: '', confirm: '' })
            }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : <><Key size={14} /> Update Password</>}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">Security Features</h2>
        <div className="space-y-4">
          {[
            { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', enabled: false },
            { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
            { label: 'Login Notifications', desc: 'Email alert on new login', enabled: true },
            { label: 'IP Whitelist', desc: 'Restrict access to specific IP addresses', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
              <div className="w-10 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0"
                style={{ background: item.enabled ? 'var(--success)' : 'var(--border)', position: 'relative' }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                  style={{ left: item.enabled ? '22px' : '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    license_expiry: true, tenant_suspension: true, pos_offline: true,
    new_tenant: false, payments: true, security_alerts: true,
    email_notifs: true, in_app_notifs: true,
  })

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="card">
      <h2 className="section-title mb-6">Notification Preferences</h2>

      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>EVENT TRIGGERS</h3>
      <div className="space-y-4 mb-6">
        {[
          { key: 'license_expiry' as const, label: 'License Expiry Alerts', desc: 'Notify 7 days before expiration' },
          { key: 'tenant_suspension' as const, label: 'Tenant Suspension', desc: 'Alert when a tenant is suspended' },
          { key: 'pos_offline' as const, label: 'POS Device Offline', desc: 'Alert when a device goes offline for 1h+' },
          { key: 'new_tenant' as const, label: 'New Tenant Registration', desc: 'Notify on new tenant sign-ups' },
          { key: 'payments' as const, label: 'Payment Events', desc: 'Failed payments and renewals' },
          { key: 'security_alerts' as const, label: 'Security Alerts', desc: 'Suspicious login attempts' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
            <div className="w-10 h-6 rounded-full cursor-pointer transition-colors"
              style={{ background: prefs[item.key] ? 'var(--success)' : 'var(--border)', position: 'relative' }}
              onClick={() => toggle(item.key)}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                style={{ left: prefs[item.key] ? '22px' : '4px' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="divider" />
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>DELIVERY CHANNELS</h3>
      <div className="space-y-3">
        {[
          { key: 'email_notifs' as const, label: 'Email Notifications', desc: 'Receive alerts via email' },
          { key: 'in_app_notifs' as const, label: 'In-App Notifications', desc: 'Show in notification panel' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0"
            style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
            <div className="w-10 h-6 rounded-full cursor-pointer transition-colors"
              style={{ background: prefs[item.key] ? 'var(--accent)' : 'var(--border)', position: 'relative' }}
              onClick={() => toggle(item.key)}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                style={{ left: prefs[item.key] ? '22px' : '4px' }} />
            </div>
          </div>
        ))}
      </div>
      <button id="save-notif-prefs-btn" className="btn-primary mt-4"
        onClick={() => toast.success('Notification preferences saved!')}>
        <Save size={14} /> Save Preferences
      </button>
    </div>
  )
}

function SystemTab({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="section-title mb-4">System Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">Supabase Project URL</label>
            <input className="form-input font-mono text-xs"
              placeholder="https://your-project.supabase.co"
              defaultValue={(import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL || ''} />
          </div>
          <div>
            <label className="form-label">Supabase Anon Key</label>
            <input type="password" className="form-input font-mono text-xs"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              defaultValue={(import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY || ''} />
          </div>
          <div className="divider" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toggle between dark and light theme</p>
            </div>
            <div className="w-10 h-6 rounded-full cursor-pointer transition-colors"
              style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border)', position: 'relative' }}
              onClick={toggleTheme}>
              <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
                style={{ left: theme === 'dark' ? '22px' : '4px' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">System Information</h2>
        <div className="space-y-3">
          {[
            ['App Version', 'v1.0.0'],
            ['Build', 'Production'],
            ['Backend', 'Supabase (Serverless)'],
            ['Auth', 'JWT + Row Level Security'],
            ['Database', 'PostgreSQL (via Supabase)'],
            ['Deployment', 'Serverless / Edge Functions'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
