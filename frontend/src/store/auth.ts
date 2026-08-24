import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

type AuthStore = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({ accessToken: access, refreshToken: refresh })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.clear()
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    { name: 'auth' }
  )
)
