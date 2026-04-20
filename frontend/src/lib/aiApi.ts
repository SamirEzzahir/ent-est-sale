import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const aiBase = () => resolveApiBase(import.meta.env.VITE_AI_API_URL as string | undefined, '/api/ai')

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  provider?: 'ollama' | 'fallback'
}

export interface ChatResponse {
  answer: string
  provider: 'ollama' | 'fallback'
  model: string
  user: {
    username: string
    role: string
    email: string
  }
  context: {
    selected_file: any | null
    available_file_count: number
  }
}

export interface FileContext {
  id: string
  filename: string
  course_name: string
  uploaded_by: string
  upload_date: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session introuvable')
  }
  return { Authorization: `Bearer ${token}` }
}

export async function aiHealthCheck(): Promise<any> {
  const response = await fetch(`${aiBase()}/health`, {
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as any) : {}
}

export async function aiGetContextFiles(): Promise<FileContext[]> {
  const response = await fetch(`${aiBase()}/context/files`, {
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  const data = JSON.parse(text) as { files: FileContext[] }
  return data.files || []
}

export async function aiChat(message: string, fileId?: string): Promise<ChatResponse> {
  const body: Record<string, any> = { message }
  if (fileId) {
    body.file_id = fileId
  }

  const response = await fetch(`${aiBase()}/chat`, {
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
  return text ? (JSON.parse(text) as ChatResponse) : { answer: '', provider: 'fallback', model: '', user: { username: '', role: '', email: '' }, context: { selected_file: null, available_file_count: 0 } }
}
