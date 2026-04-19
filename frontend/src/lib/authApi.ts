import { apiRoleToAppRole } from './jwt'
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, setStoredTokens } from './authStorage'
import type { User } from '../types'
import { users } from '../data/mockData'

const base = () => (import.meta.env.VITE_AUTH_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  refresh_expires_in?: number
  user: { id: string; email: string; role: string }
}

function initialsFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'U'
  const parts = local.split(/[._-]/).filter(Boolean)
  const s = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : local.slice(0, 2)
  return s.toUpperCase()
}

export function buildUserFromAuthUser(apiUser: { id: string; email: string; role: string }): User {
  const role = apiRoleToAppRole(apiUser.role)
  const mock = users.find((u) => u.role === role)
  return {
    ...(mock ?? users[0]),
    id: apiUser.id,
    email: apiUser.email,
    role,
    name: mock?.name ?? apiUser.email.split('@')[0]?.replace(/[._]/g, ' ') ?? 'Utilisateur',
    avatar: mock?.avatar ?? initialsFromEmail(apiUser.email),
  }
}

export async function loginRequest(email: string, password: string): Promise<{ tokens: LoginResponse; user: User }> {
  const url = `${base()}/login`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(text || `Login failed (${r.status})`)
  }
  const data = JSON.parse(text) as LoginResponse
  setStoredTokens(data.access_token, data.refresh_token)
  const user = buildUserFromAuthUser(data.user)
  return { tokens: data, user }
}

export async function refreshSession(): Promise<{ access: string; refresh: string; user: User } | null> {
  const refresh = getStoredRefreshToken()
  if (!refresh) return null
  const url = `${base()}/refresh`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  const text = await r.text()
  if (!r.ok) {
    clearStoredTokens()
    return null
  }
  const data = JSON.parse(text) as LoginResponse
  setStoredTokens(data.access_token, data.refresh_token)
  const user = buildUserFromAuthUser(data.user)
  return {
    access: data.access_token,
    refresh: data.refresh_token,
    user,
  }
}

export function authApiConfigured(): boolean {
  return Boolean(base())
}

export interface RegisterResponse {
  message: string
  user_id: string
}

function parseApiError(text: string, status: number): string {
  try {
    const j = JSON.parse(text) as { detail?: string | Array<{ msg?: string }> }
    if (typeof j.detail === 'string') return j.detail
    if (Array.isArray(j.detail)) {
      return j.detail.map((d) => d.msg ?? JSON.stringify(d)).join(' ') || `Erreur ${status}`
    }
  } catch {
    /* ignore */
  }
  return text || `Erreur ${status}`
}

export type AppRealmRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export async function adminCreateUserRequest(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: AppRealmRole,
): Promise<RegisterResponse> {
  const url = `${base()}/admin/users`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
    }),
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(parseApiError(text, r.status))
  }
  return JSON.parse(text) as RegisterResponse
}

export async function submitValidationRequest(email: string, message: string): Promise<{ message: string }> {
  const url = `${base()}/validation-request`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      message: message.trim(),
    }),
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(parseApiError(text, r.status))
  }
  return JSON.parse(text) as { message: string }
}

export interface PendingAccount {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
  status: string
  provision_source?: string
  validation_requested_at?: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session admin requise. Connectez-vous.')
  }
  return { Authorization: `Bearer ${token}` }
}

export async function listPendingAccounts(): Promise<PendingAccount[]> {
  const url = `${base()}/pending-accounts`
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      ...authHeader(),
    },
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(parseApiError(text, r.status))
  }
  const data = JSON.parse(text) as { items: PendingAccount[] }
  return data.items ?? []
}

export async function approvePendingAccount(userId: string): Promise<string> {
  const url = `${base()}/pending-accounts/${encodeURIComponent(userId)}/approve`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeader(),
    },
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(parseApiError(text, r.status))
  }
  const data = JSON.parse(text) as { message?: string }
  return data.message ?? 'Compte valide.'
}

export async function rejectPendingAccount(userId: string): Promise<string> {
  const url = `${base()}/pending-accounts/${encodeURIComponent(userId)}/reject`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeader(),
    },
  })
  const text = await r.text()
  if (!r.ok) {
    throw new Error(parseApiError(text, r.status))
  }
  const data = JSON.parse(text) as { message?: string }
  return data.message ?? 'Compte refuse.'
}
