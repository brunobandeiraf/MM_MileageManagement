import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiGet, apiPost, apiPut } from '../services/api'

export type Role = 'ADMIN' | 'FUNCIONARIO' | 'USER'

export type Bank = {
  id: string
  name: string
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url: string | null
  role: Role
  banks: Bank[]
}

export type ProfileUpdate = {
  name?: string
  email?: string
  phone?: string
  avatar_url?: string | null
}

export type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: ProfileUpdate) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateMyBanks: (bankIds: string[]) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  updateMyBanks: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiGet<{ user: User }>('/auth/me')
      .then(({ user }) => {
        setUser(user)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const { user } = await apiPost<{ user: User }>('/auth/login', { email, password })
    setUser(user)
  }

  async function logout(): Promise<void> {
    await apiPost('/auth/logout')
    setUser(null)
  }

  async function updateProfile(data: ProfileUpdate): Promise<void> {
    const { user } = await apiPut<{ user: User }>('/auth/me', data)
    setUser(user)
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiPut('/auth/me/password', { currentPassword, newPassword })
  }

  async function updateMyBanks(bankIds: string[]): Promise<void> {
    const { user } = await apiPut<{ user: User }>('/auth/me/banks', { bankIds })
    setUser(user)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateProfile, changePassword, updateMyBanks }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
