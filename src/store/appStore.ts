import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AdminUser, Notification } from '@/types/database'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  setUser: (user: AdminUser | null) => void
  logout: () => void
}

interface ThemeState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setNotifications: (notifications: Notification[]) => void
}

type AppState = AuthState & ThemeState & UIState & NotificationState

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Theme
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
        document.documentElement.setAttribute('data-theme', newTheme)
      },

      // UI
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (n) => {
        set((s) => ({
          notifications: [n, ...s.notifications].slice(0, 50),
          unreadCount: s.unreadCount + (n.is_read ? 0 : 1),
        }))
      },
      markAsRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, s.unreadCount - 1),
        }))
      },
      markAllAsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }))
      },
      setNotifications: (notifications) => {
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
        })
      },
    }),
    {
      name: 'superadmin-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
