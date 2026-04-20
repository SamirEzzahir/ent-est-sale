import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const assignmentBase = () => resolveApiBase(import.meta.env.VITE_ASSIGNMENT_API_URL as string | undefined, '/api/assignments')

export interface Assignment {
  assignment_id: string
  course_id: string
  title: string
  description?: string
  created_by: string
  due_date?: string
  max_grade: number
  created_date?: string
}

export interface AssignmentCreatePayload {
  course_id: string
  title: string
  description?: string
  due_date?: string
  max_grade?: number
}

export interface Submission {
  submission_id: string
  assignment_id: string
  student_id: string
  filename: string
  minio_path: string
  submitted_date?: string
  status: string
}

export interface SubmissionPayload {
  filename: string
  minio_path: string
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Session introuvable')
  return { Authorization: `Bearer ${token}` }
}

export async function createAssignment(payload: AssignmentCreatePayload): Promise<{ assignment_id: string; message: string }> {
  const response = await fetch(`${assignmentBase()}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { assignment_id: string; message: string }) : { assignment_id: '', message: '' }
}

export async function listAssignments(courseId?: string): Promise<Assignment[]> {
  const url = courseId ? `${assignmentBase()}/?course_id=${courseId}` : `${assignmentBase()}/`
  const response = await fetch(url, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Assignment[]) : []
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const response = await fetch(`${assignmentBase()}/${assignmentId}`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Assignment) : ({} as Assignment)
}

export async function submitAssignment(assignmentId: string, submission: SubmissionPayload): Promise<{ submission_id: string; message: string }> {
  const response = await fetch(`${assignmentBase()}/${assignmentId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(submission),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { submission_id: string; message: string }) : { submission_id: '', message: '' }
}

export async function getSubmissions(assignmentId: string): Promise<Submission[]> {
  const response = await fetch(`${assignmentBase()}/${assignmentId}/submissions`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Submission[]) : []
}

export async function gradeSubmission(assignmentId: string, submissionId: string, score: number, feedback?: string): Promise<{ message: string }> {
  const response = await fetch(`${assignmentBase()}/${assignmentId}/submissions/${submissionId}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ score, feedback }),
  })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}

export async function getMySubmissions(): Promise<Submission[]> {
  const response = await fetch(`${assignmentBase()}/my-submissions`, { headers: authHeader() })
  const text = await readResponseText(response)
  if (!response.ok) throw new Error(parseApiError(text, response.status))
  return text ? (JSON.parse(text) as Submission[]) : []
}
