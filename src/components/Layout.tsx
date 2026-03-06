import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Key, Monitor, Bell, FileText,
  Settings, ChevronLeft, ChevronRight, Shield, Sun, Moon,
  LogOut, Search, Menu, X, Zap
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { getInitials } from '@/lib/utils'
import NotificationPanel from '@/components/NotificationPanel'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/licenses', icon: Key, label: 'Licenses' },
  { to: '/pos-devices', icon: Monitor, label: 'POS Devices' },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user, theme, toggleTheme, sidebarOpen, toggleSidebar, setSidebarOpen, logout, unreadCount } = useAppStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 z-50 ${mobileMenuOpen ? 'fixed inset-y-0 left-0' : 'relative hidden md:flex'}`}
        style={{
          width: sidebarOpen ? '240px' : '68px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          minWidth: sidebarOpen ? '240px' : '68px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>SuperAdmin</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>POS Management</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarOpen && (
            <p className="text-xs font-semibold px-2 mb-2" style={{ color: 'var(--text-muted)' }}>MAIN MENU</p>
          )}
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? label : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {!sidebarOpen && label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold text-white"
                  style={{ background: 'var(--danger)', fontSize: '9px' }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              {getInitials(user?.full_name || 'SA')}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
            {sidebarOpen && (
              <button className="btn-icon p-1" onClick={handleLogout} title="Logout">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse button */}
        <button
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all hidden md:flex"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button className="btn-icon md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={18} />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                id="global-search"
                type="text"
                className="search-input"
                placeholder="Search tenants, licenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button className="btn-icon" onClick={toggleTheme} id="theme-toggle" title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notifications-btn"
                className="btn-icon relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-dot" />
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Security badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <Shield size={13} />
              <span className="text-xs font-semibold">Secured</span>
            </div>

            {/* User avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              {getInitials(user?.full_name || 'SA')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
