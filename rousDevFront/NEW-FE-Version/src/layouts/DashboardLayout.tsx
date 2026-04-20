import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Cog,
  Expand,
  FileText,
  GraduationCap,
  House,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sun,
  Users,
  Wrench,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { entContent } from '../config/content'

const mainNav = [
  { label: 'Accueil', to: 'dashboard', icon: House, roles: ['student', 'teacher', 'admin'] },
  { label: 'Inscriptions', to: 'profiles/student', icon: Users, roles: ['student', 'teacher', 'admin'] },
  { label: 'Gestion utilisateurs', to: 'users', icon: Users, roles: ['admin'] },
  { label: 'Scolarite et examens', to: 'examens', icon: GraduationCap, roles: ['student', 'teacher', 'admin'] },
  { label: 'Outils pedagogiques', to: 'cours', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
  { label: 'Outils collaboratifs', to: 'forum', icon: MessageCircle, roles: ['student', 'teacher', 'admin'] },
  { label: 'Assistance', to: 'forum/assistant', icon: LifeBuoy, roles: ['student', 'teacher', 'admin'] },
]

const moduleNav = [
  { label: 'Cours', to: 'cours', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
  { label: 'Documents', to: 'documents', icon: FileText, roles: ['student', 'teacher', 'admin'] },
  { label: 'Messagerie', to: 'messagerie', icon: MessageCircle, roles: ['student', 'teacher', 'admin'] },
  { label: 'Calendrier', to: 'calendrier', icon: CalendarDays, roles: ['student', 'teacher', 'admin'] },
  { label: 'Examens', to: 'examens', icon: GraduationCap, roles: ['student', 'teacher', 'admin'] },
  { label: 'Gestion utilisateurs', to: 'users', icon: Users, roles: ['admin'] },
  { label: 'Admin', to: 'admin/statistiques', icon: ShieldCheck, roles: ['admin'] },
]

export function DashboardLayout() {
  const { rolePrefix } = useParams()
  const { currentRole, currentUser, logout } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()
  const base = `/${rolePrefix ?? currentRole}`
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModulesOpen, setIsModulesOpen] = useState(true)

  const visibleMainNav = useMemo(
    () =>
      mainNav
        .filter((item) => item.roles.includes(currentRole))
        .map((item) => ({
          ...item,
          to: `${base}/${item.label === 'Inscriptions' ? `profiles/${currentRole}` : item.to}`,
        })),
    [base, currentRole],
  )

  const visibleModuleNav = useMemo(
    () =>
      moduleNav
        .filter((item) => item.roles.includes(currentRole))
        .map((item) => ({ ...item, to: `${base}/${item.to}` })),
    [base, currentRole],
  )

  const quickStats = useMemo(
    () =>
      currentRole === 'student'
        ? { label: 'Etudiant', value: '4 devoirs en attente' }
        : currentRole === 'teacher'
          ? { label: 'Enseignant', value: '31 copies a corriger' }
          : { label: 'Admin', value: 'Services relies au gateway' },
    [currentRole],
  )

  const isInModuleRoute = useMemo(
    () =>
      visibleModuleNav.some(
        (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
      ),
    [location.pathname, visibleModuleNav],
  )

  useEffect(() => {
    if (isInModuleRoute) setIsModulesOpen(true)
    setIsMobileMenuOpen(false)
  }, [location.pathname, isInModuleRoute])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {isMobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="logo-dot logo-wrap">
            <img src={entContent.branding.logoPath} alt="Logo EST Sale" className="logo-image" />
          </div>
          <div className="brand-copy">
            <strong>{entContent.branding.appName}</strong>
            <p>{entContent.branding.tagline}</p>
          </div>
          <button
            type="button"
            className="icon-btn collapse-btn desktop-only"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Etendre le menu' : 'Reduire le menu'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
        <nav className="main-nav">
          <p className="menu-caption">Navigation principale</p>
          {visibleMainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon-wrap">
                <item.icon size={15} className="nav-icon" />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-section">
          <button
            type="button"
            className={`modules-toggle ${isModulesOpen ? 'open' : ''}`}
            onClick={() => setIsModulesOpen((prev) => !prev)}
          >
            <h4>Modules</h4>
            <ChevronDown size={14} />
          </button>
          {isModulesOpen && (
            <div className="module-links">
              {visibleModuleNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`mini-link ${location.pathname === item.to || location.pathname.startsWith(`${item.to}/`) ? 'active' : ''}`}
                >
                  <span className="mini-icon-wrap">
                    <item.icon size={14} className="mini-icon" />
                  </span>
                  <span className="mini-label">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {currentRole === 'admin' ? (
          <div className="sidebar-section">
            <h4>Administration</h4>
            <div className="module-links">
              <Link
                to={`${base}/users`}
                className={`mini-link ${location.pathname.includes('/users') ? 'active' : ''}`}
              >
                <span className="mini-icon-wrap">
                  <Users size={14} className="mini-icon" />
                </span>
                <span className="mini-label">Gestion utilisateurs</span>
              </Link>
              <Link
                to={`${base}/admin/statistiques`}
                className={`mini-link ${location.pathname.includes('/admin/statistiques') ? 'active' : ''}`}
              >
                <span className="mini-icon-wrap">
                  <ShieldCheck size={14} className="mini-icon" />
                </span>
                <span className="mini-label">Statistiques admin</span>
              </Link>
            </div>
          </div>
        ) : null}
        <div className="sidebar-foot">
          <Wrench size={14} />
          <p>Session EST Sale</p>
          <strong>Semestre Printemps 2026</strong>
          <span className="role-pill">{quickStats.label}</span>
          <small>{quickStats.value}</small>
        </div>
      </aside>

      <main className="main-layout">
        <header className="topbar">
          <button className="icon-btn mobile-only" type="button" aria-label="menu" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="topbar-left">
            <div className="topbar-title">
              <strong>Accueil ENT</strong>
              <span>{entContent.branding.workspaceLabel}</span>
            </div>
            <input className="top-search" placeholder="Search..." />
          </div>
          <div className="user-actions">
            <button className="icon-btn utility-btn" type="button" title="Notifications">
              <Bell size={14} />
            </button>
            <button className="icon-btn utility-btn" type="button" title="Theme">
              <Sun size={14} />
            </button>
            <button className="icon-btn utility-btn" type="button" title="Fullscreen">
              <Expand size={14} />
            </button>
            <button className="icon-btn utility-btn" type="button" title="Settings">
              <Cog size={14} />
            </button>
            <div className="flag-chip">FR</div>
            <span className="flag-chip" title="Role Keycloak">
              {currentRole.toUpperCase()}
            </span>
            <span className="user-name">{currentUser.name}</span>
            <div className="avatar">{currentUser.avatar}</div>
            <button className="text-btn" type="button" onClick={() => void handleLogout()}>
              <LogOut size={15} /> Deconnexion
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
