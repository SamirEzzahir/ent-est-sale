import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const gradeBase = () => resolveApiBase(import.meta.env.VITE_GRADE_API_URL as string | undefined, '/api/grades')

export interface Grade {
  grade_id: string
  student_id: string
  course_id: string
  grade_type: string
  score: number
  max_score: number
  label?: string
  recorded_by: string
  record_date?: string
}

export interface GradeCreatePayload {
  student_id: string
  course_id: string
  grade_type: string
  score: number
  max_score?: number
  label?: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Session introuvable')
  return { Authorization: `Bearer ${token}` }
}

export async function createGrade(payload: GradeCreatePayload): Promise<{ grade_id: string; message: string }> {
  const response = await fetch(`${gradeBase()}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { grade_id: string; message: string }) : { grade_id: '', message: '' }
}

export async function getMyGrades(): Promise<Grade[]> {
  const response = await fetch(`${gradeBase()}/my-grades`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Grade[]) : []
}

export async function getCourseGrades(courseId: string): Promise<Grade[]> {
  const response = await fetch(`${gradeBase()}/course/${courseId}`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Grade[]) : []
}

export async function deleteGrade(gradeId: string): Promise<{ message: string }> {
  const response = await fetch(`${gradeBase()}/${gradeId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}
