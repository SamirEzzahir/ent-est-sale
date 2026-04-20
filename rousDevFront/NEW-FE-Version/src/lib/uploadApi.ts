import { getStoredAccessToken } from './authStorage'
import { parseApiError, readResponseText, resolveApiBase } from './api'

const uploadBase = () => resolveApiBase(import.meta.env.VITE_UPLOAD_API_URL as string | undefined, '/api/upload')

export interface UploadResult {
  id: string
  filename: string
  uploaded_by: string
  upload_date: string
}

export async function uploadCourseFile(file: File, courseName: string): Promise<UploadResult> {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session expiree. Reconnectez-vous.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('course_name', courseName.trim() || 'default')

  const response = await fetch(`${uploadBase()}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return JSON.parse(text) as UploadResult
}
