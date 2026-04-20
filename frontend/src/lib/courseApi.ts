import { getStoredAccessToken } from './authStorage'
import { parseApiError, readJsonOrThrow, readResponseText, resolveApiBase } from './api'

const courseBase = () => resolveApiBase(import.meta.env.VITE_COURSE_API_URL as string | undefined, '/api/courses')

export interface Course {
  course_id: string
  course_code: string
  course_name: string
  description?: string
  teacher_id: string
  teacher_name: string
  semester: number
  academic_year: string
  credits: number
  created_date?: string
}

export interface CourseCreatePayload {
  course_code: string
  course_name: string
  description?: string
  semester: number
  academic_year: string
  credits: number
}

export interface CourseUpdatePayload {
  course_code?: string
  course_name?: string
  description?: string
  semester?: number
  academic_year?: string
  credits?: number
}

function authHeader() {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Session introuvable')
  }
  return { Authorization: `Bearer ${token}` }
}

export async function listCourses(): Promise<Course[]> {
  const response = await fetch(`${courseBase()}/`, {
    method: 'GET',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as Course[]) : []
}

export async function getCourse(courseId: string): Promise<Course> {
  const response = await fetch(`${courseBase()}/${courseId}`, {
    method: 'GET',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as Course) : ({} as Course)
}

export async function createCourse(payload: CourseCreatePayload): Promise<{ course_id: string; message: string }> {
  const response = await fetch(`${courseBase()}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { course_id: string; message: string }) : { course_id: '', message: '' }
}

export async function updateCourse(courseId: string, payload: CourseUpdatePayload): Promise<{ message: string }> {
  const response = await fetch(`${courseBase()}/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}

export async function deleteCourse(courseId: string): Promise<{ message: string }> {
  const response = await fetch(`${courseBase()}/${courseId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}

export async function enrollCourse(courseId: string, studentId: string): Promise<{ message: string }> {
  const response = await fetch(`${courseBase()}/${courseId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ student_id: studentId }),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}

export async function unenrollCourse(courseId: string, studentId: string): Promise<{ message: string }> {
  const response = await fetch(`${courseBase()}/${courseId}/enroll/${studentId}`, {
    method: 'DELETE',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as { message: string }) : { message: '' }
}

export async function getCourseStudents(courseId: string): Promise<Array<{ student_id: string; enrolled_date?: string }>> {
  const response = await fetch(`${courseBase()}/${courseId}/students`, {
    method: 'GET',
    headers: authHeader(),
  })
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  return text ? (JSON.parse(text) as Array<{ student_id: string; enrolled_date?: string }>) : []
}
