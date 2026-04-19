import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { users } from '../data/mockData'
import type { Role, User } from '../types'
import { authApiConfigured, buildUserFromAuthUser, loginRequest, refreshSession } from '../lib/authApi'
import { clearStoredTokens, getStoredAccessToken } from '../lib/authStorage'
import { appRoleFromRealmAccess, decodeJwtPayload, isTokenExpired } from '../lib/jwt'

interface AppContextValue {
  isAuthenticated: boolean
  isSessionReady: boolean
  currentRole: Role
  currentUser: User
  login: (email: string, password: string) => Promise<Role>
  logout: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

function userFromTokenPayload(payload: Record<string, unknown>, fallbackEmail: string): { role: Role; email: string; sub: string } {
  const role = appRoleFromRealmAccess(payload)
  if (!role) {
    throw new Error('Token sans role ENT (ADMIN, TEACHER, STUDENT)')
  }
  const email = String(payload.email ?? payload.preferred_username ?? fallbackEmail)
  const sub = String(payload.sub ?? '')
  return { role, email, sub }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role>('student')
  const [currentUser, setCurrentUser] = useState<User>(() => users[0])

  const logout = useCallback(() => {
    clearStoredTokens()
    setIsAuthenticated(false)
    setCurrentRole('student')
    setCurrentUser(users[0])
  }, [])

  const bootstrapSession = useCallback(async () => {
    const token = getStoredAccessToken()
    if (!token) {
      setIsAuthenticated(false)
      return
    }
    if (!authApiConfigured()) {
      clearStoredTokens()
      setIsAuthenticated(false)
      return
    }
    try {
      let active = token
      if (isTokenExpired(active)) {
        const refreshed = await refreshSession()
        if (!refreshed) {
          setIsAuthenticated(false)
          return
        }
        active = refreshed.access
        setCurrentRole(refreshed.user.role)
        setCurrentUser(refreshed.user)
        setIsAuthenticated(true)
        return
      }
      const payload = decodeJwtPayload(active)
      const { role, email, sub } = userFromTokenPayload(payload, '')
      setCurrentRole(role)
      setCurrentUser(
        buildUserFromAuthUser({
          id: sub,
          email,
          role: role.toUpperCase(),
        }),
      )
      setIsAuthenticated(true)
    } catch {
      clearStoredTokens()
      setIsAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    void bootstrapSession().finally(() => setIsSessionReady(true))
  }, [bootstrapSession])

  const login = useCallback(async (email: string, password: string) => {
    if (!authApiConfigured()) {
      throw new Error('Definir VITE_AUTH_API_URL (ex: http://localhost:8000)')
    }
    const { user } = await loginRequest(email, password)
    setCurrentRole(user.role)
    setCurrentUser(user)
    setIsAuthenticated(true)
    return user.role
  }, [])

  const value: AppContextValue = useMemo(
    () => ({
      isAuthenticated,
      isSessionReady,
      currentRole,
      currentUser,
      login,
      logout,
    }),
    [isAuthenticated, isSessionReady, currentRole, currentUser, login, logout],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}
