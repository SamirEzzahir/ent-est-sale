import { getStoredAccessToken } from './authStorage'

const base = () =>
  (import.meta.env.VITE_UPLOAD_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function uploadApiConfigured(): boolean {
  return Boolean(base())
}

export interface UploadResult {
  id: string
  filename: string
  uploaded_by: string
  upload_date: string
}

export async function uploadCourseFile(file: File, courseName: string): Promise<UploadResult> {
  const url = `${base()}/api/upload/upload`
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session expiree. Reconnectez-vous.')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('course_name', courseName.trim() || 'default')

  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const text = await r.text()
  if (!r.ok) {
    try {
      const j = JSON.parse(text) as { detail?: string | Array<{ msg?: string }> }
      if (typeof j.detail === 'string') throw new Error(j.detail)
      if (Array.isArray(j.detail)) {
        throw new Error(j.detail.map((d) => d.msg ?? JSON.stringify(d)).join(' ') || `Erreur ${r.status}`)
      }
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes('JSON')) throw e
    }
    throw new Error(text || `Upload failed (${r.status})`)
  }
  return JSON.parse(text) as UploadResult
}
