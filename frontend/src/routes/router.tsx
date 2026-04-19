import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { ForgotPasswordPage, HelpPage, LoginPage, RegistrationClosedPage, ValidateAccountPage } from '../pages/AuthPages'
import {
  AdminValidateAccountsPage,
  AdminProfilePage,
  AdminRolesPage,
  AdminStatisticsPage,
  AdminSystemOverviewPage,
  AdminUsersPage,
  AssignmentsPage,
  AssistantPage,
  CalendarPage,
  ChatPage,
  CourseDetailsPage,
  CourseUploadPage,
  CoursesPage,
  DashboardPage,
  EditProfilePage,
  ExamSchedulePage,
  ExamsPage,
  FilesPage,
  ForumPage,
  GradesPage,
  MessagingPage,
  NotificationsPage,
  StudentProfilePage,
  TeacherProfilePage,
  ThreadPage,
} from '../pages/ModulePages'

const ROLE_PREFIXES = new Set(['admin', 'teacher', 'student'])

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isSessionReady } = useAppContext()
  if (!isSessionReady) {
    return <div className="auth-loading" aria-busy="true" />
  }
  return isAuthenticated ? children : <Navigate to="/" replace />
}

function RoleScopeGuard({ children }: { children: ReactElement }) {
  const { rolePrefix } = useParams()
  const { currentRole } = useAppContext()
  if (!rolePrefix || !ROLE_PREFIXES.has(rolePrefix)) {
    return <Navigate to="/" replace />
  }
  if (rolePrefix !== currentRole) {
    return <Navigate to={`/${currentRole}/dashboard`} replace />
  }
  return children
}

function RoleFallback() {
  const { currentRole } = useAppContext()
  const location = useLocation()
  if (location.pathname.includes('validate-account') || location.pathname.includes('validate-accounts')) {
    return <Navigate to={`/${currentRole}/account-approvals`} replace />
  }
  return <Navigate to={`/${currentRole}/dashboard`} replace />
}

function AccountApprovalsRedirect() {
  const { rolePrefix } = useParams()
  const target = `/${rolePrefix ?? 'admin'}/account-approvals`
  return <Navigate to={target} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/register', element: <RegistrationClosedPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/validate-account', element: <ValidateAccountPage /> },
  { path: '/validate-accounts', element: <ValidateAccountPage /> },
  { path: '/help', element: <HelpPage /> },
  {
    path: '/:rolePrefix',
    element: (
      <ProtectedRoute>
        <RoleScopeGuard>
          <DashboardLayout />
        </RoleScopeGuard>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'cours', element: <CoursesPage /> },
      { path: 'cours/:id', element: <CourseDetailsPage /> },
      { path: 'cours/upload', element: <CourseUploadPage /> },
      { path: 'documents', element: <FilesPage /> },
      { path: 'messagerie', element: <MessagingPage /> },
      { path: 'messagerie/chat', element: <ChatPage /> },
      { path: 'messagerie/notifications', element: <NotificationsPage /> },
      { path: 'calendrier', element: <CalendarPage /> },
      { path: 'calendrier/examens', element: <ExamSchedulePage /> },
      { path: 'forum', element: <ForumPage /> },
      { path: 'forum/thread', element: <ThreadPage /> },
      { path: 'forum/assistant', element: <AssistantPage /> },
      { path: 'examens', element: <ExamsPage /> },
      { path: 'devoirs', element: <AssignmentsPage /> },
      { path: 'notes', element: <GradesPage /> },
      { path: 'profiles/student', element: <StudentProfilePage /> },
      { path: 'profiles/teacher', element: <TeacherProfilePage /> },
      { path: 'profiles/admin', element: <AdminProfilePage /> },
      { path: 'profiles/edit', element: <EditProfilePage /> },
      { path: 'admin/users', element: <AdminUsersPage /> },
      { path: 'account-approvals', element: <AdminValidateAccountsPage /> },
      { path: 'admin/validate-accounts', element: <AccountApprovalsRedirect /> },
      { path: 'admin/validate-account', element: <AccountApprovalsRedirect /> },
      { path: 'validate-accounts', element: <AccountApprovalsRedirect /> },
      { path: 'validate-account', element: <AccountApprovalsRedirect /> },
      { path: 'admin/roles', element: <AdminRolesPage /> },
      { path: 'admin/statistiques', element: <AdminStatisticsPage /> },
      { path: 'admin/systeme', element: <AdminSystemOverviewPage /> },
      { path: '*', element: <RoleFallback /> },
    ],
  },
])
