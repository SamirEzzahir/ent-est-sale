import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const scheduleBase = () => resolveApiBase(import.meta.env.VITE_SCHEDULE_API_URL as string | undefined, '/api/schedule')

export interface ClassSchedule {
  schedule_id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  teacher_id: string
  academic_year: string
  semester: number
}

export interface Exam {
  exam_id: string
  course_id: string
  title: string
  exam_date?: string
  duration_minutes: number
  room: string
  exam_type: string
  created_by: string
}

export interface ScheduleCreatePayload {
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  teacher_id: string
  academic_year: string
  semester: number
}

export interface ExamCreatePayload {
  course_id: string
  title: string
  exam_date: string
  duration_minutes: number
  room: string
  exam_type: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Session introuvable')
  return { Authorization: `Bearer ${token}` }
}

export async function createSchedule(payload: ScheduleCreatePayload): Promise<{ schedule_id: string; message: string }> {
  const response = await fetch(`${scheduleBase()}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { schedule_id: string; message: string }) : { schedule_id: '', message: '' }
}

export async function getSchedule(courseId: string): Promise<ClassSchedule[]> {
  const response = await fetch(`${scheduleBase()}/schedule/${courseId}`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as ClassSchedule[]) : []
}

export async function createExam(payload: ExamCreatePayload): Promise<{ exam_id: string; message: string }> {
  const response = await fetch(`${scheduleBase()}/exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { exam_id: string; message: string }) : { exam_id: '', message: '' }
}

export async function getExams(): Promise<Exam[]> {
  const response = await fetch(`${scheduleBase()}/exams`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Exam[]) : []
}

export async function getExam(examId: string): Promise<Exam> {
  const response = await fetch(`${scheduleBase()}/exams/${examId}`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Exam) : ({} as Exam)
}
