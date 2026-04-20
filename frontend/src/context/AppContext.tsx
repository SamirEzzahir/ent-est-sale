import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { users } from '../data/mockData'
import type { Role, User } from '../types'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  refreshSession,
  restoreUserFromToken,
} from '../lib/authApi'
import { clearStoredTokens, getStoredAccessToken } from '../lib/authStorage'
import { isTokenExpired } from '../lib/jwt'

interface AppContextValue {
  isAuthenticated: boolean
  isSessionReady: boolean
  currentRole: Role
  currentUser: User
  login: (identifier: string, password: string) => Promise<Role>
  completeLogin: (user: User) => void
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role>('student')
  const [currentUser, setCurrentUser] = useState<User>(() => users[0])

  const applyAuthenticatedUser = useCallback((user: User) => {
    setCurrentRole(user.role)
    setCurrentUser(user)
    setIsAuthenticated(true)
  }, [])

  const clearSessionState = useCallback(() => {
    clearStoredTokens()
    setIsAuthenticated(false)
    setCurrentRole('student')
    setCurrentUser(users[0])
  }, [])

  const logout = useCallback(async () => {
    const hadSession = Boolean(getStoredAccessToken())
    clearSessionState()
    if (!hadSession) return

    try {
      const logoutUrl = await logoutRequest()
      if (logoutUrl) {
        window.location.href = logoutUrl
      }
    } catch {
      // Local session is already cleared; ignore remote logout failures.
    }
  }, [clearSessionState])

  const bootstrapSession = useCallback(async () => {
    const token = getStoredAccessToken()
    if (!token) {
      setIsAuthenticated(false)
      return
    }

    try {
      if (isTokenExpired(token)) {
        const refreshed = await refreshSession()
        if (!refreshed) {
          clearSessionState()
          return
        }
        applyAuthenticatedUser(refreshed.user)
        return
      }

      const restoredUser = restoreUserFromToken(token)
      applyAuthenticatedUser(restoredUser)

      try {
        const freshUser = await fetchCurrentUser(token)
        applyAuthenticatedUser(freshUser)
      } catch {
        // Token payload is enough to keep the session alive locally.
      }
    } catch {
      clearSessionState()
    }
  }, [applyAuthenticatedUser, clearSessionState])

  useEffect(() => {
    void bootstrapSession().finally(() => setIsSessionReady(true))
  }, [bootstrapSession])

  const login = useCallback(
    async (identifier: string, password: string) => {
      const { user } = await loginRequest(identifier, password)
      applyAuthenticatedUser(user)
      return user.role
    },
    [applyAuthenticatedUser],
  )

  const completeLogin = useCallback(
    (user: User) => {
      applyAuthenticatedUser(user)
    },
    [applyAuthenticatedUser],
  )

  const value: AppContextValue = useMemo(
    () => ({
      isAuthenticated,
      isSessionReady,
      currentRole,
      currentUser,
      login,
      completeLogin,
      logout,
    }),
    [isAuthenticated, isSessionReady, currentRole, currentUser, login, completeLogin, logout],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}
