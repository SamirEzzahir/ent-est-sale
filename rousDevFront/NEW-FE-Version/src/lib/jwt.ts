import type { Role } from '../types'

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT')
  }
  let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) {
    b64 += '='.repeat(4 - pad)
  }
  const json = atob(b64)
  return JSON.parse(json) as Record<string, unknown>
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  try {
    const p = decodeJwtPayload(token) as { exp?: number }
    if (p.exp == null) return true
    return Date.now() / 1000 >= p.exp - skewSeconds
  } catch {
    return true
  }
}

export function appRoleFromRealmAccess(payload: Record<string, unknown>): Role | null {
  const ra = payload.realm_access as { roles?: string[] } | undefined
  const roles = ra?.roles ?? []
  const upper = new Set(roles.map((r) => String(r).toUpperCase()))
  if (upper.has('ADMIN')) return 'admin'
  if (upper.has('TEACHER')) return 'teacher'
  if (upper.has('STUDENT')) return 'student'
  return null
}

export function apiRoleToAppRole(r: string): Role {
  const x = r.toUpperCase()
  if (x === 'ADMIN') return 'admin'
  if (x === 'TEACHER') return 'teacher'
  return 'student'
}
