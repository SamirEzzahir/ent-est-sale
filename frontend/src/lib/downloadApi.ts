import { getStoredAccessToken } from './authStorage'
import { parseApiError, readResponseText, resolveApiBase } from './api'

const downloadBase = () => resolveApiBase(import.meta.env.VITE_DOWNLOAD_API_URL as string | undefined, '/api/download')

export interface RemoteFileItem {
  id: string
  filename: string
  course_name: string
  uploaded_by: string
  upload_date: string
  minio_path?: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session expiree. Reconnectez-vous.')
  }
  return { Authorization: `Bearer ${token}` }
}

export async function listRemoteFiles(): Promise<RemoteFileItem[]> {
  const response = await fetch(`${downloadBase()}/files`, {
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as RemoteFileItem[]) : []
}

export async function getFileBlob(fileId: string, disposition: 'attachment' | 'inline' = 'attachment'): Promise<Blob> {
  const response = await fetch(`${downloadBase()}/files/${encodeURIComponent(fileId)}/content?disposition=${disposition}`, {
    headers: authHeader(),
  })
  if (!response.ok) {
    const text = await readResponseText(response)
    throw new Error(parseApiError(text, response.status))
  }
  return response.blob()
}

export async function updateRemoteFile(fileId: string, payload: { filename?: string; course_name: string }): Promise<RemoteFileItem> {
  const response = await fetch(`${downloadBase()}/files/${encodeURIComponent(fileId)}`, {
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return JSON.parse(text) as RemoteFileItem
}

export async function deleteRemoteFile(fileId: string): Promise<void> {
  const response = await fetch(`${downloadBase()}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!response.ok) {
    const text = await readResponseText(response)
    throw new Error(parseApiError(text, response.status))
  }
}
