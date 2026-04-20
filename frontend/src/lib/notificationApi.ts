import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const notificationBase = () => resolveApiBase(import.meta.env.VITE_NOTIFICATION_API_URL as string | undefined, '/api/notifications')

export interface Message {
  message_id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  sent_date?: string
  read: boolean
}

export interface Announcement {
  announcement_id: string
  course_id: string
  title: string
  content: string
  created_by: string
  created_date?: string
  pinned: boolean
}

export interface Notification {
  notification_id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  created_date?: string
  link?: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Session introuvable')
  return { Authorization: `Bearer ${token}` }
}

export async function sendMessage(recipientId: string, subject: string, content: string): Promise<{ message_id: string; message: string }> {
  const response = await fetch(`${notificationBase()}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ recipient_id: recipientId, subject, content }),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { message_id: string; message: string }) : { message_id: '', message: '' }
}

export async function getMessages(): Promise<Message[]> {
  const response = await fetch(`${notificationBase()}/messages`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Message[]) : []
}

export async function createAnnouncement(courseId: string, title: string, content: string, pinned: boolean = false): Promise<{ announcement_id: string; message: string }> {
  const response = await fetch(`${notificationBase()}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ course_id: courseId, title, content, pinned }),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { announcement_id: string; message: string }) : { announcement_id: '', message: '' }
}

export async function getAnnouncements(courseId: string): Promise<Announcement[]> {
  const response = await fetch(`${notificationBase()}/announcements/${courseId}`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Announcement[]) : []
}

export async function getNotifications(): Promise<Notification[]> {
  const response = await fetch(`${notificationBase()}/`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Notification[]) : []
}
