/**
 * Centralized API Configuration
 * All API endpoints are configured here and can be easily changed for deployment
 *
 * DEPLOYMENT:
 * Set VITE_API_BASE_URL in .env to change the base API URL
 * Example: VITE_API_BASE_URL=http://192.168.1.100
 */

function resolveApiBase(envValue: string | undefined, fallback: string): string {
  const trimmed = envValue?.trim()
  if (!trimmed) return fallback
  return trimmed.replace(/\/$/, '')
}

const API_BASE_URL = resolveApiBase(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
  '/api'
)

export const API_ENDPOINTS = {
  // Main API gateway
  base: API_BASE_URL,

  // Service endpoints
  upload: resolveApiBase(import.meta.env.VITE_UPLOAD_API_URL as string | undefined, `${API_BASE_URL}/upload`),
  download: resolveApiBase(import.meta.env.VITE_DOWNLOAD_API_URL as string | undefined, `${API_BASE_URL}/download`),
  auth: resolveApiBase(import.meta.env.VITE_AUTH_API_URL as string | undefined, `${API_BASE_URL}/auth`),
  courses: resolveApiBase(import.meta.env.VITE_COURSES_API_URL as string | undefined, `${API_BASE_URL}/courses`),
  assignments: resolveApiBase(import.meta.env.VITE_ASSIGNMENTS_API_URL as string | undefined, `${API_BASE_URL}/assignments`),
  grades: resolveApiBase(import.meta.env.VITE_GRADES_API_URL as string | undefined, `${API_BASE_URL}/grades`),
  notifications: resolveApiBase(import.meta.env.VITE_NOTIFICATIONS_API_URL as string | undefined, `${API_BASE_URL}/notifications`),
  schedule: resolveApiBase(import.meta.env.VITE_SCHEDULE_API_URL as string | undefined, `${API_BASE_URL}/schedule`),
  ai: resolveApiBase(import.meta.env.VITE_AI_API_URL as string | undefined, `${API_BASE_URL}/ai`),
}

// Keycloak configuration
export const KEYCLOAK_CONFIG = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ent-est-sale',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ent-frontend',
}

console.log('[Config] API Base URL:', API_BASE_URL)
console.log('[Config] Keycloak URL:', KEYCLOAK_CONFIG.url)
