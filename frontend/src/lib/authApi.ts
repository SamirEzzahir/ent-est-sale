import type { Role, User } from '../types'
import { clearStoredTokens, getStoredAccessToken, getStoredRefreshToken, setStoredTokens } from './authStorage'
import { apiRoleToAppRole, appRoleFromRealmAccess, decodeJwtPayload, isTokenExpired } from './jwt'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const authBase = () => resolveApiBase(import.meta.env.VITE_AUTH_API_URL as string | undefined, '/api/auth')

export interface AuthUserPayload {
  id?: string
  username?: string
  email?: string
  role: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string | null
  token_type?: string
  expires_in?: number
  refresh_expires_in?: number
  username?: string
  role?: string
  email?: string
  user?: AuthUserPayload
}

export type AppRealmRole = 'student' | 'teacher' | 'admin'

export interface AdminCreateUserPayload {
  username: string
  password: string
  confirmPassword: string
  role: AppRealmRole
  email?: string
  firstName?: string
  lastName?: string
}

function displayNameFromIdentifier(identifier: string): string {
  return identifier
    .split(/[._@-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function initialsFromIdentifier(identifier: string): string {
  const cleaned = identifier.replace(/[^A-Za-z0-9]/g, '')
  return (cleaned.slice(0, 2) || 'US').toUpperCase()
}

export function buildUserFromAuthUser(apiUser: AuthUserPayload): User {
  const role = apiRoleToAppRole(apiUser.role)
  const email = apiUser.email?.trim() || apiUser.username?.trim() || ''
  const identifier = apiUser.username?.trim() || email || 'utilisateur'
  return {
    id: apiUser.id?.trim() || identifier,
    name: displayNameFromIdentifier(identifier),
    email,
    role,
    faculty: 'Non renseigne',
    level: role === 'student' ? 'Etudiant' : role === 'teacher' ? 'Enseignant' : 'Administration',
    avatar: initialsFromIdentifier(identifier),
  }
}

function normalizeLoginResponse(data: LoginResponse): { access: string; refresh: string | null; user: User } {
  const access = data.access_token
  const refresh = data.refresh_token ?? null
  const apiUser: AuthUserPayload = data.user ?? {
    id: undefined,
    username: data.username,
    email: data.email,
    role: data.role ?? 'student',
  }
  return {
    access,
    refresh,
    user: buildUserFromAuthUser(apiUser),
  }
}

export async function loginRequest(identifier: string, password: string): Promise<{ access: string; refresh: string | null; user: User }> {
  const response = await fetch(`${authBase()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: identifier.trim(), password }),
  })
  const data = await readJsonOrThrow<LoginResponse>(response)
  const normalized = normalizeLoginResponse(data)
  setStoredTokens(normalized.access, normalized.refresh)
  return normalized
}

export async function refreshSession(): Promise<{ access: string; refresh: string | null; user: User } | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null

  const response = await fetch(`${authBase()}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    clearStoredTokens()
    return null
  }

  const data = JSON.parse(text) as LoginResponse
  const normalized = normalizeLoginResponse(data)
  setStoredTokens(normalized.access, normalized.refresh)
  return normalized
}

export async function fetchCurrentUser(accessToken?: string): Promise<User> {
  const token = accessToken ?? getStoredAccessToken()
  if (!token) {
    throw new Error('Session introuvable')
  }
  const response = await fetch(`${authBase()}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await readJsonOrThrow<AuthUserPayload>(response)
  return buildUserFromAuthUser(payload)
}

export function restoreUserFromToken(token: string): User {
  const payload = decodeJwtPayload(token)
  const role: Role = appRoleFromRealmAccess(payload) ?? 'student'

  const username = String(payload.preferred_username ?? payload.email ?? payload.sub ?? 'utilisateur')
  const email = String(payload.email ?? payload.preferred_username ?? '')
  return {
    id: String(payload.sub ?? username),
    name: displayNameFromIdentifier(username),
    email,
    role,
    faculty: 'Non renseigne',
    level: role === 'student' ? 'Etudiant' : role === 'teacher' ? 'Enseignant' : 'Administration',
    avatar: initialsFromIdentifier(username),
  }
}

export function canReuseStoredAccessToken(): boolean {
  const token = getStoredAccessToken()
  return Boolean(token && !isTokenExpired(token))
}

export async function beginKeycloakLogin(): Promise<void> {
  const redirectUri = `${window.location.origin}/auth/callback`
  const response = await fetch(`${authBase()}/login/keycloak?redirect_uri=${encodeURIComponent(redirectUri)}`)
  const data = await readJsonOrThrow<{ login_url: string }>(response)
  window.location.href = data.login_url
}

export async function completeKeycloakLogin(code: string): Promise<{ access: string; refresh: string | null; user: User }> {
  const redirectUri = `${window.location.origin}/auth/callback`
  const response = await fetch(
    `${authBase()}/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
  )
  const data = await readJsonOrThrow<LoginResponse>(response)
  const normalized = normalizeLoginResponse(data)
  setStoredTokens(normalized.access, normalized.refresh)
  return normalized
}

export async function logoutRequest(): Promise<string | null> {
  const postLogoutRedirectUri = `${window.location.origin}/`
  const response = await fetch(
    `${authBase()}/logout/keycloak?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`,
  )
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  const data = JSON.parse(text) as { logout_url?: string }
  return data.logout_url ?? null
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session admin requise. Connectez-vous.')
  }
  return { Authorization: `Bearer ${token}` }
}

export async function adminCreateUserRequest(payload: AdminCreateUserPayload): Promise<{ id?: string; username?: string; message?: string }> {
  const body: Record<string, string> = {
    username: payload.username.trim(),
    password: payload.password,
    confirm_password: payload.confirmPassword,
    role: payload.role,
  }
  if (payload.email?.trim()) body.email = payload.email.trim()
  if (payload.firstName?.trim()) body.first_name = payload.firstName.trim()
  if (payload.lastName?.trim()) body.last_name = payload.lastName.trim()

  const response = await fetch(`${resolveApiBase(import.meta.env.VITE_ADMIN_API_URL as string | undefined, '/api/admin')}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { id?: string; username?: string; message?: string }) : {}
}
