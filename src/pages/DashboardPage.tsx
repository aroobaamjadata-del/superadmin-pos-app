import { useState, useEffect } from 'react'
import {
  Users, Key, Monitor, DollarSign, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, RefreshCw, Activity, Zap, CheckCircle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { dashboardApi } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { DashboardStats } from '@/types/database'

// Mock trend data
const trendData = [
  { month: 'Sep', tenants: 28, licenses: 72, devices: 198, revenue: 32000 },
  { month: 'Oct', tenants: 33, licenses: 85, devices: 224, revenue: 37500 },
  { month: 'Nov', tenants: 38, licenses: 98, devices: 259, revenue: 41200 },
  { month: 'Dec', tenants: 41, licenses: 108, devices: 280, revenue: 44800 },
  { month: 'Jan', tenants: 44, licenses: 116, devices: 296, revenue: 46100 },
  { month: 'Feb', tenants: 47, licenses: 124, devices: 312, revenue: 48750 },
]

const planData = [
  { name: 'Starter', value: 18, color: '#6366f1' },
  { name: 'Professional', value: 21, color: '#10b981' },
  { name: 'Enterprise', value: 8, color: '#f59e0b' },
]

const topTenants = [
  { name: 'Portobello Bistro', revenue: 8400, devices: 12, status: 'active' },
  { name: 'Sunrise Café Chain', revenue: 7200, devices: 9, status: 'active' },
  { name: 'Metro Burger Co.', revenue: 6800, devices: 8, status: 'active' },
  { name: 'The Pizza Hub', revenue: 5900, devices: 7, status: 'active' },
  { name: 'Noodle House', revenue: 4300, devices: 5, status: 'suspended' },
]

const recentAlerts = [
  { id: '1', type: 'warning', text: '8 licenses expiring within 7 days', time: '2h ago' },
  { id: '2', type: 'error', text: 'POS-Terminal-07 offline for 2+ hours', time: '3h ago' },
  { id: '3', type: 'info', text: 'New tenant "Café Milano" pending approval', time: '5h ago' },
  { id: '4', type: 'success', text: 'License TEN-A1B2C3 renewed successfully', time: '1d ago' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await dashboardApi.getStats()
      setStats(data)
      setLastRefresh(new Date())
    } catch {
      // Use fallback stats
      setStats({
        total_tenants: 47, active_tenants: 38, suspended_tenants: 5,
        total_licenses: 124, active_licenses: 98, expired_licenses: 14,
        total_pos_devices: 312, online_pos_devices: 287,
        total_monthly_revenue: 48750, expiring_soon: 8,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  const statCards = [
    {
      id: 'total-tenants',
      label: 'Total Tenants',
      value: formatNumber(stats?.total_tenants || 0),
      sub: `${stats?.active_tenants || 0} active`,
      icon: Users,
      color: '#6366f1',
      trend: '+12%',
      up: true,
    },
    {
      id: 'active-licenses',
      label: 'Active Licenses',
      value: formatNumber(stats?.active_licenses || 0),
      sub: `${stats?.expired_licenses || 0} expired`,
      icon: Key,
      color: '#10b981',
      trend: '+8%',
      up: true,
    },
    {
      id: 'pos-devices',
      label: 'Online POS Devices',
      value: formatNumber(stats?.online_pos_devices || 0),
      sub: `of ${stats?.total_pos_devices || 0} total`,
      icon: Monitor,
      color: '#3b82f6',
      trend: '+5%',
      up: true,
    },
    {
      id: 'monthly-revenue',
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.total_monthly_revenue || 0),
      sub: 'across all tenants',
      icon: DollarSign,
      color: '#f59e0b',
      trend: '+18%',
      up: true,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Welcome back! Here's what's happening across your tenants.
          </p>
        </div>
        <button
          id="refresh-dashboard"
          className="btn-secondary gap-2"
          onClick={loadStats}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Alert banner */}
      {stats?.expiring_soon ? (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--warning)' }}>
            <strong>{stats.expiring_soon} licenses</strong> are expiring within the next 7 days.{' '}
            <a href="/licenses" className="underline font-semibold">Review now →</a>
          </p>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.id} id={card.id} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}22` }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${card.up ? '' : ''}`}
                style={{ color: card.up ? 'var(--success)' : 'var(--danger)' }}>
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? <span className="skeleton inline-block w-20 h-7" /> : card.value}
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.label}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Revenue & Growth Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>+18% MoM</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="devicesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" name="Revenue ($)" />
              <Area type="monotone" dataKey="devices" stroke="#10b981" strokeWidth={2} fill="url(#devicesGradient)" name="Devices" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="card">
          <h3 className="section-title mb-1">Plan Distribution</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Tenants by subscription</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {planData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {planData.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top tenants */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Top Tenants by Revenue</h3>
            <Zap size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="space-y-3">
            {topTenants.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(t.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${(t.revenue / 8400) * 100}%`, background: t.status === 'active' ? 'var(--accent)' : 'var(--warning)' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.devices} POS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Alerts</h3>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0`}
                  style={{
                    background: alert.type === 'warning' ? 'var(--warning-light)' :
                      alert.type === 'error' ? 'var(--danger-light)' :
                        alert.type === 'success' ? 'var(--success-light)' : 'var(--info-light)',
                  }}>
                  {alert.type === 'warning' && <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />}
                  {alert.type === 'error' && <AlertTriangle size={13} style={{ color: 'var(--danger)' }} />}
                  {alert.type === 'success' && <CheckCircle size={13} style={{ color: 'var(--success)' }} />}
                  {alert.type === 'info' && <Activity size={13} style={{ color: 'var(--info)' }} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{alert.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* License usage bar chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Monthly License Activations</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Number of license activations per month</p>
          </div>
          <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
            <Bar dataKey="licenses" fill="#6366f1" radius={[4, 4, 0, 0]} name="Licenses" />
            <Bar dataKey="tenants" fill="#10b981" radius={[4, 4, 0, 0]} name="Tenants" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
