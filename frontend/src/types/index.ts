export type Role = 'student' | 'teacher' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  faculty: string
  level: string
  avatar: string
}

export interface Course {
  id: string
  title: string
  teacher: string
  code: string
  credits: number
  category: string
  progress: number
  resources: { name: string; type: string; size: string }[]
}

export interface FileItem {
  id: string
  name: string
  category: string
  owner: string
  date: string
  size: string
}

export interface Message {
  id: string
  from: string
  subject: string
  preview: string
  date: string
  unread: boolean
}

export interface EventItem {
  id: string
  title: string
  date: string
  type: 'course' | 'exam' | 'meeting'
  location: string
}

export interface Assignment {
  id: string
  title: string
  course: string
  dueDate: string
  status: 'pending' | 'submitted' | 'late'
  grade?: string
}
