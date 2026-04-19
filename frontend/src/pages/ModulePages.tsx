import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, BookOpen, CalendarClock, FileUp, Headset, NotebookPen, ShieldCheck, Wrench } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { adminStats, assignments, courses, events, files, forumTopics, messages, notifications, users } from '../data/mockData'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader, SearchField } from '../components/ui'
import { entContent } from '../config/content'
import { uploadApiConfigured, uploadCourseFile } from '../lib/uploadApi'
import {
  adminCreateUserRequest,
  approvePendingAccount,
  authApiConfigured,
  listPendingAccounts,
  rejectPendingAccount,
  type AppRealmRole,
  type PendingAccount,
} from '../lib/authApi'

function RoleScopeNote({ module }: { module: string }) {
  const { currentRole } = useAppContext()
  const copy = {
    student: {
      courses: "Mode etudiant: consultation des cours, telechargement des ressources et suivi progression.",
      files: "Mode etudiant: consultation et telechargement de fichiers autorises.",
      messaging: "Mode etudiant: reception, reponse et suivi notifications pedagogiques.",
      calendar: "Mode etudiant: consultation emploi du temps, examens et rappels.",
      forum: "Mode etudiant: participation aux discussions et entraide.",
      assistant: "Mode etudiant: assistance IA pour revision, organisation et procedures ENT.",
      exams: "Mode etudiant: consultation des examens, soumissions et resultats.",
      profile: "Mode etudiant: mise a jour de vos informations personnelles.",
      admin: "Mode etudiant: consultation limitee. Les operations d'administration sont reservees aux admins.",
    },
    teacher: {
      courses: "Mode enseignant: publication, modification et suivi des modules en ligne.",
      files: "Mode enseignant: ajout de ressources et gestion documentaire pedagogique.",
      messaging: "Mode enseignant: communication avec etudiants et administration.",
      calendar: "Mode enseignant: planification des seances, examens et rattrapages.",
      forum: "Mode enseignant: moderation des discussions et reponses académiques.",
      assistant: "Mode enseignant: assistant IA pour generation pedagogique et support ENT.",
      exams: "Mode enseignant: gestion des devoirs, corrections et publication des notes.",
      profile: "Mode enseignant: profil et responsabilites de module.",
      admin: "Mode enseignant: consultation limitee. Les operations globales sont reservees aux admins.",
    },
    admin: {
      courses: "Mode administrateur: supervision globale des services cours et politiques d'acces.",
      files: "Mode administrateur: controle stockage MinIO, gouvernance et securite des fichiers.",
      messaging: "Mode administrateur: supervision canaux de notifications et incidents de communication.",
      calendar: "Mode administrateur: coordination calendrier institutionnel et regles de publication.",
      forum: "Mode administrateur: supervision communautaire, moderation et conformite.",
      assistant: "Mode administrateur: gouvernance IA (Ollama/Llama3) et usages ENT.",
      exams: "Mode administrateur: pilotage global examens/devoirs et suivi qualite.",
      profile: "Mode administrateur: gestion complete des profils et roles ENT.",
      admin: "Mode administrateur: acces complet aux fonctions de gestion systeme.",
    },
  } as const

  return (
    <Card>
      <p className="muted">{copy[currentRole][module as keyof typeof copy.student]}</p>
    </Card>
  )
}

export function DashboardPage() {
  const { currentRole } = useAppContext()
  const { rolePrefix } = useParams()
  const base = rolePrefix ? `/${rolePrefix}` : `/${currentRole}`
  const [activeTab, setActiveTab] = useState(entContent.dashboard.tabs[0])
  const [isNoticeVisible, setIsNoticeVisible] = useState(true)
  const [activeMetric, setActiveMetric] = useState(0)

  const dashboardByRole = {
    student: {
      roleLabel: 'Etudiant',
      subtitle: 'Suivez vos cours, devoirs, examens et notifications academiques.',
      heroStats: [
        { value: '87%', label: 'Progression semestre' },
        { value: '4', label: 'Devoirs en attente' },
        { value: '2', label: 'Examens a venir' },
      ],
      summaryCards: [
        { label: 'Moyenne generale', value: '15.8/20', badge: 'Bon niveau', badgeType: 'info' as const },
        { label: 'Presence', value: '96%', badge: '+2%', badgeType: 'success' as const },
        { label: 'Messages non lus', value: '7', badge: 'Nouveau', badgeType: 'warning' as const },
        { label: 'Ressources vues', value: '42', badge: 'Cette semaine', badgeType: 'info' as const },
      ],
      priorities: ['Consulter les notes publiees', 'Finaliser le devoir Frontend', "Verifier l'horaire des examens"],
      activities: [
        'Nouvelle note publiee en Frontend Moderne',
        'Rappel: devoir Microservices demain',
        'Nouveau document de cours disponible',
      ],
      widgets: ['Messagerie', 'Notes', 'Calendrier des examens', "Demande d'intervention", 'Cours en ligne', 'Assistance ENT'],
    },
    teacher: {
      roleLabel: 'Enseignant',
      subtitle: 'Pilotez vos modules, publications, corrections et echanges avec les etudiants.',
      heroStats: [
        { value: '6', label: 'Cours actifs' },
        { value: '31', label: 'Copies a corriger' },
        { value: '12', label: 'Messages recus' },
      ],
      summaryCards: [
        { label: 'Ressources publiees', value: '126', badge: 'Ce semestre', badgeType: 'info' as const },
        { label: 'Devoirs corriges', value: '214', badge: '+18', badgeType: 'success' as const },
        { label: 'Taux de validation', value: '91%', badge: 'Promotion S4', badgeType: 'success' as const },
        { label: 'Demandes etudiants', value: '9', badge: 'A traiter', badgeType: 'warning' as const },
      ],
      priorities: ['Publier les ressources du module', 'Corriger les devoirs en attente', 'Repondre aux messages etudiants'],
      activities: [
        'Nouveau rendu recu: TP API Gateway',
        'Publication de support React en ligne',
        'Session de rattrapage programmee',
      ],
      widgets: ['Cours en ligne', 'Messagerie', 'Devoirs', 'Calendrier des examens', 'Documents', 'Assistance ENT'],
    },
    admin: {
      roleLabel: 'Administrateur',
      subtitle: 'Supervisez les micro-services ENT, les utilisateurs et les operations systeme.',
      heroStats: [
        { value: '4', label: 'Micro-services coeur' },
        { value: '99.98%', label: 'Disponibilite' },
        { value: '93', label: 'Tickets support' },
      ],
      summaryCards: [
        { label: 'Utilisateurs actifs', value: '2 483', badge: '+5.2%', badgeType: 'success' as const },
        { label: 'Cours en ligne', value: '148', badge: 'Modules publies', badgeType: 'info' as const },
        { label: 'Fichiers MinIO', value: '1.8 TB', badge: 'Stockage ENT', badgeType: 'warning' as const },
        { label: 'Alertes systeme', value: '3', badge: 'A verifier', badgeType: 'warning' as const },
      ],
      priorities: ['Suivre les indicateurs ENT', 'Traiter les tickets de support', 'Verifier la disponibilite des services'],
      activities: [
        'Service Ajout de Fichiers stable',
        'Pic de charge observe sur notifications',
        'Mise a jour securite planifiee samedi',
      ],
      widgets: ['Admin', 'Messagerie', 'Documents', 'Examens', 'Calendrier', 'Assistance ENT'],
    },
  } as const

  const roleConfig = dashboardByRole[currentRole]
  const widgets = roleConfig.widgets
  const widgetIcons: Record<string, ReactNode> = {
    Admin: <Wrench size={16} />,
    Documents: <BookOpen size={16} />,
    Devoirs: <NotebookPen size={16} />,
    Calendrier: <CalendarClock size={16} />,
    Messagerie: <Bell size={16} />,
    Notes: <NotebookPen size={16} />,
    'Calendrier des examens': <CalendarClock size={16} />,
    "Demande d'intervention": <Wrench size={16} />,
    'Cours en ligne': <BookOpen size={16} />,
    'Assistance ENT': <Headset size={16} />,
  }
  return (
    <>
      <div className={`dashboard-role dashboard-${currentRole}`}>
      <PageHeader title={entContent.dashboard.pageTitle} subtitle={`Vue globale de votre espace numerique EST Sale - profil ${roleConfig.roleLabel}.`} />
      <div className="dashboard-tabs">
        {entContent.dashboard.tabs.map((tab) => (
          <button type="button" key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>
      {isNoticeVisible && (
        <section className="notice-banner">
          <strong>{entContent.dashboard.noticeTitle}</strong>
          <span>{entContent.dashboard.noticeText}</span>
          <button type="button" className="notice-close" onClick={() => setIsNoticeVisible(false)}>Fermer</button>
        </section>
      )}
      <section className="hero-panel role-hero">
        <div>
          <p className="hero-kicker">Plateforme academique unifiee</p>
          <h2>{roleConfig.roleLabel} - Espace Numerique de Travail EST Sale</h2>
          <p className="muted">{activeTab} - {roleConfig.subtitle}</p>
        </div>
        <div className="hero-stats">
          {roleConfig.heroStats.map((item) => (
            <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
          ))}
        </div>
      </section>

      <div className="grid cols-4">
        {roleConfig.summaryCards.map((card, index) => (
          <Card key={card.label}>
            <p className="muted">{card.label}</p>
            <h2 className="metric">{card.value}</h2>
            <div className="toolbar">
              <Badge value={card.badge} type={card.badgeType} />
              <button type="button" className={`ghost-btn small ${activeMetric === index ? 'selected' : ''}`} onClick={() => setActiveMetric(index)}>
                Details
              </button>
            </div>
          </Card>
        ))}
      </div>
      <Card title={`Analyse detaillee - ${roleConfig.summaryCards[activeMetric].label}`}>
        <p className="muted">
          Valeur actuelle: <strong>{roleConfig.summaryCards[activeMetric].value}</strong> - Indicateur: {roleConfig.summaryCards[activeMetric].badge}.
          Cette zone est interactive et change selon la carte KPI selectionnee.
        </p>
      </Card>
      {currentRole === 'admin' ? (
        <Card title="Approbation des comptes" action={<Badge value="ADMIN" type="warning" />}>
          <p className="muted">
            Accedez rapidement a la moderation des inscriptions etudiantes depuis le dashboard.
          </p>
          <Link to={`${base}/account-approvals`} className="primary-btn">
            Ouvrir l'approbation
          </Link>
        </Card>
      ) : null}
      <div className="grid cols-2">
        <Card title={`Priorites - ${roleConfig.roleLabel}`}>
          <ul className="list">
            {roleConfig.priorities.map((priority) => (
              <li key={priority} className="notification-item">{priority}</li>
            ))}
          </ul>
        </Card>
        <Card title="Activites recentes">
          <ul className="timeline">
            {roleConfig.activities.map((activity, index) => (
              <li key={activity}><span>{['08:40', '10:15', '11:30'][index]}</span>{activity}</li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="grid cols-3">
        {widgets.map((item) => (
          <Card key={item} title={item} action={<div className="widget-action">{widgetIcons[item]} <Badge value="Actif" type="info" /></div>}>
            <p className="muted">Acces rapide aux donnees et actions de ce module.</p>
            <button className="ghost-btn small">Ouvrir</button>
          </Card>
        ))}
      </div>
      </div>
    </>
  )
}

export function CoursesPage() {
  const { rolePrefix } = useParams()
  const base = rolePrefix ? `/${rolePrefix}` : ''
  const { currentRole } = useAppContext()
  const canPublishCourse = currentRole === 'teacher' || currentRole === 'admin'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesQuery =
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.code.toLowerCase().includes(query.toLowerCase()) ||
          course.teacher.toLowerCase().includes(query.toLowerCase())
        const matchesCategory = category === 'all' || course.category === category
        return matchesQuery && matchesCategory
      }),
    [query, category],
  )

  return (
    <>
      <PageHeader
        title="Gestion des cours"
        subtitle="Liste des modules, ressources et progression."
        action={canPublishCourse ? <Link to={`${base}/cours/upload`} className="primary-btn">Uploader un cours</Link> : undefined}
      />
      <RoleScopeNote module="courses" />
      <div className="toolbar">
        <SearchField placeholder="Rechercher un cours, enseignant ou code..." value={query} onChange={setQuery} />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes categories</option>
          <option value="Informatique">Informatique</option>
          <option value="Web">Web</option>
        </select>
        <Badge value={`${filteredCourses.length} resultats`} />
      </div>
      <div className="grid cols-2">
        {filteredCourses.map((course) => (
          <Card key={course.id} title={course.title} action={<Badge value={`${course.progress}%`} type="info" />}>
            <p className="muted">{course.code} - {course.teacher}</p>
            <p>{course.credits} credits</p>
            <div className="progress-line"><span style={{ width: `${course.progress}%` }} /></div>
            <Link className="sub-link" to={`${base}/cours/${course.id}`}>Voir details</Link>
          </Card>
        ))}
      </div>
      {!filteredCourses.length && <EmptyState message="Aucun cours ne correspond aux filtres actifs." />}
      <Card title="Conformite Microservice - Gestion des cours">
        <ul className="list">
          <li className="forum-item"><div><strong>Responsabilite</strong><span>Creation, modification et consultation des cours en ligne.</span></div><Badge value="Spec PDF" type="info" /></li>
          <li className="forum-item"><div><strong>Metadonnees</strong><span>Titre, description et references de fichiers en Cassandra.</span></div><Badge value="Cassandra" /></li>
          <li className="forum-item"><div><strong>Securite</strong><span>Acces protege par token JWT via service Auth/Keycloak.</span></div><Badge value="JWT" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function CourseDetailsPage() {
  const course = courses[0]
  return (
    <>
      <PageHeader title={`Details - ${course.title}`} subtitle="Ressources pedagogiques et suivi." />
      <RoleScopeNote module="courses" />
      <div className="grid cols-2">
      <Card title="Ressources / fichiers">
        <ul className="list">
          {course.resources.map((resource) => <li key={resource.name}>{resource.name} <span>{resource.type} - {resource.size}</span></li>)}
        </ul>
      </Card>
      <Card title="Flux de travail du projet">
        <ul className="timeline">
          <li><span>1</span> Enseignant publie le cours via API</li>
          <li><span>2</span> Metadonnees en Cassandra + fichiers en MinIO</li>
          <li><span>3</span> Etudiant consulte et telecharge via ENT</li>
          <li><span>4</span> Assistant IA repond aux questions du cours</li>
        </ul>
      </Card>
      </div>
    </>
  )
}

export function CourseUploadPage() {
  const { currentRole } = useAppContext()
  const [courseName, setCourseName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (currentRole === 'student') {
    return (
      <>
        <PageHeader title="Upload de cours (enseignant)" subtitle="Publication de contenus pedagogiques." />
        <ErrorState message="Acces refuse: cette page est reservee aux enseignants et administrateurs." />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Upload de cours (enseignant)" subtitle="Publication de contenus pedagogiques." />
      <RoleScopeNote module="courses" />
      {!uploadApiConfigured() ? (
        <ErrorState message="Definir VITE_UPLOAD_API_URL (ex: http://localhost:8002) dans .env puis redemarrer Vite." />
      ) : null}
      <div className="upload-layout">
        <Card>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setSuccess(null)
              if (!file) {
                setError('Choisissez un fichier.')
                return
              }
              setPending(true)
              try {
                const res = await uploadCourseFile(file, courseName)
                setSuccess(`Fichier envoye: ${res.filename} (id ${res.id}).`)
                setFile(null)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload impossible')
              } finally {
                setPending(false)
              }
            }}
          >
            <div className="upload-header">
              <div className="upload-header-icon">
                <FileUp size={18} />
              </div>
              <div>
                <strong>Depot de ressources pedagogiques</strong>
                <p>Envoyez vos supports vers MinIO avec indexation metadonnees.</p>
              </div>
            </div>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="state success" role="status">
                {success}
              </p>
            ) : null}
            <label className="field">
              <span>Nom du cours (metadonnees)</span>
              <input
                value={courseName}
                onChange={(ev) => setCourseName(ev.target.value)}
                placeholder="Ex: Bases de donnees avancees"
              />
            </label>
            <label className="field">
              <span>Fichier (PDF, Office, images)</span>
              <input
                className="upload-file-input"
                type="file"
                onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
                accept=".pdf,.txt,.docx,.pptx,.xlsx,.jpg,.jpeg,.png"
              />
            </label>
            {file ? (
              <div className="upload-file-summary">
                <strong>{file.name}</strong>
                <span>{Math.max(1, Math.round(file.size / 1024))} KB</span>
              </div>
            ) : null}
            <button className="primary-btn" type="submit" disabled={pending || !uploadApiConfigured()}>
              {pending ? 'Envoi...' : 'Envoyer vers MinIO'}
            </button>
          </form>
        </Card>
        <Card title="Bonnes pratiques d'upload">
          <ul className="upload-tips">
            <li>
              <ShieldCheck size={16} />
              <span>Vérifiez le nom de fichier pour faciliter la recherche.</span>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>Formats autorises: PDF, Office, texte et images.</span>
            </li>
            <li>
              <ShieldCheck size={16} />
              <span>Taille maximale: 100 MB par fichier.</span>
            </li>
          </ul>
        </Card>
      </div>
      <Card title="Politique de publication">
        <div className="chips">
          <span className="chip">Role enseignant requis</span>
          <span className="chip">Token JWT obligatoire</span>
          <span className="chip">Stockage MinIO</span>
          <span className="chip">Metadonnees Cassandra</span>
        </div>
      </Card>
    </>
  )
}

export function FilesPage() {
  const { currentRole } = useAppContext()
  const canUploadFile = currentRole === 'teacher' || currentRole === 'admin'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const filteredFiles = useMemo(
    () =>
      files.filter((file) => {
        const matchesQuery =
          file.name.toLowerCase().includes(query.toLowerCase()) ||
          file.owner.toLowerCase().includes(query.toLowerCase())
        const matchesCategory = category === 'all' || file.category === category
        return matchesQuery && matchesCategory
      }),
    [query, category],
  )

  return (
    <>
      <PageHeader title="Bibliotheque de documents" subtitle="Recherche, filtrage, upload et download." />
      <RoleScopeNote module="files" />
      <div className="toolbar">
        <SearchField placeholder="Rechercher un document..." value={query} onChange={setQuery} />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Toutes categories</option>
          <option value="Scolarite">Scolarite</option>
          <option value="Support">Support</option>
          <option value="Cours">Cours</option>
        </select>
        {canUploadFile && <button className="primary-btn">Upload</button>}
      </div>
      <Card>
        <table className="table"><thead><tr><th>Nom</th><th>Categorie</th><th>Proprietaire</th><th>Date</th><th>Taille</th><th></th></tr></thead><tbody>
          {filteredFiles.map((file) => <tr key={file.id}><td>{file.name}</td><td>{file.category}</td><td>{file.owner}</td><td>{file.date}</td><td>{file.size}</td><td><button className="ghost-btn small">Download</button></td></tr>)}
        </tbody></table>
        <div className="toolbar">
          <button className="ghost-btn small">Precedent</button>
          <Badge value="Page 1 / 4" />
          <button className="ghost-btn small">Suivant</button>
        </div>
      </Card>
      {!filteredFiles.length && <ErrorState message="Aucun fichier trouve. Essayez un autre mot-cle ou categorie." />}
      <Card title="Conformite Microservice - Gestion des fichiers">
        <ul className="list">
          <li className="forum-item"><div><strong>Stockage</strong><span>Fichiers pedagogiques stockes dans MinIO (objet).</span></div><Badge value="MinIO" type="info" /></li>
          <li className="forum-item"><div><strong>Securite</strong><span>Generation de liens securises apres authentification.</span></div><Badge value="JWT" type="success" /></li>
          <li className="forum-item"><div><strong>Traçabilite</strong><span>Metadonnees indexees en Cassandra pour la recherche.</span></div><Badge value="Cassandra" /></li>
        </ul>
      </Card>
    </>
  )
}

export function MessagingPage() {
  return (
    <>
      <PageHeader title="Messagerie / Inbox" subtitle="Conversations, messages recus et notifications." />
      <RoleScopeNote module="messaging" />
      <div className="grid cols-2">
        <Card title="Inbox">
          <ul className="list">
            {messages.map((m) => (
              <li key={m.id} className={`message-item ${m.unread ? 'unread' : ''}`}>
                <div>
                  <strong>{m.subject}</strong>
                  <p>{m.preview}</p>
                  <span>{m.from} - {m.date}</span>
                </div>
                {m.unread && <Badge value="Nouveau" type="info" />}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Notifications">
          <ul className="list">{notifications.map((n) => <li key={n.id} className="notification-item">{n.label}</li>)}</ul>
        </Card>
      </div>
      <Card title="Conformite Microservice - Messagerie et notifications">
        <ul className="list">
          <li className="forum-item"><div><strong>Canal interne ENT</strong><span>Echanges etudiants/enseignants/administration centralises.</span></div><Badge value="Actif" type="success" /></li>
          <li className="forum-item"><div><strong>Mode asynchrone</strong><span>Compatible architecture evenementielle (RabbitMQ / Kafka).</span></div><Badge value="Message broker" type="info" /></li>
        </ul>
      </Card>
    </>
  )
}

export function ChatPage() {
  return (
    <>
      <PageHeader title="Conversation" subtitle="Chat temps reel (mock)." />
      <RoleScopeNote module="messaging" />
      <Card>
        <div className="chat-window">
          <p><strong>Pr. Idrissi:</strong> Bonjour, n'oubliez pas la soumission du projet.</p>
          <p><strong>Vous:</strong> Merci, je finalise l'interface aujourd'hui.</p>
        </div>
        <div className="toolbar"><input placeholder="Ecrire un message..." /><button className="primary-btn">Envoyer</button></div>
      </Card>
      <Card title="Conformite Microservice - Chat">
        <ul className="list">
          <li className="forum-item"><div><strong>Communication synchrone</strong><span>Echanges directs etudiants/enseignants (temps reel).</span></div><Badge value="WebSocket ready" type="info" /></li>
          <li className="forum-item"><div><strong>Securite</strong><span>Conversation accessible apres authentification JWT.</span></div><Badge value="JWT" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function NotificationsPage() {
  return (
    <>
      <PageHeader title="Panneau des notifications" subtitle="Alertes academiques et systeme ENT." />
      <RoleScopeNote module="messaging" />
      <Card>
        <ul className="list">
          {notifications.map((n) => (
            <li key={n.id} className="forum-item">
              <span>{n.label}</span> <Badge value={n.type} />
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Conformite notifications">
        <ul className="list">
          <li className="forum-item"><div><strong>Canaux</strong><span>Notifications ENT, email et push (architecture evenementielle).</span></div><Badge value="RabbitMQ/Kafka" type="info" /></li>
          <li className="forum-item"><div><strong>Ciblage</strong><span>Diffusion selon profils etudiants, enseignants, administrateurs.</span></div><Badge value="Role-based" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendrier et emploi du temps" subtitle="Vue calendrier, semaine et examens." />
      <RoleScopeNote module="calendar" />
      <div className="grid cols-2">
        <Card title="Evenements">
          <ul className="list">
            {events.map((event) => <li key={event.id} className="forum-item"><div><strong>{event.title}</strong><span>{event.date} ({event.location})</span></div><Badge value={event.type} /></li>)}
          </ul>
        </Card>
        <Card title="Semaine (mock grid)">
          <div className="week-grid">
            {['Lun','Mar','Mer','Jeu','Ven'].map((d)=><div key={d}><strong>{d}</strong><p>08:30 - 17:30</p></div>)}
          </div>
        </Card>
      </div>
      <Card title="Timeline des evenements">
        <ul className="timeline">
          <li><span>09:00</span> Cours React Avance - Salle B12</li>
          <li><span>12:00</span> Pause et permanence pedagogique</li>
          <li><span>14:00</span> Examen Bases de Donnees - Amphi 2</li>
          <li><span>16:30</span> Reunion Club IA - Lab Innovation</li>
        </ul>
      </Card>
      <Card title="Conformite Microservice - Calendrier / Emploi du temps">
        <ul className="list">
          <li className="forum-item"><div><strong>Planification</strong><span>Calendrier des cours, examens et evenements academiques.</span></div><Badge value="Interne ENT" type="info" /></li>
          <li className="forum-item"><div><strong>Integration</strong><span>Extensible vers Google Calendar ou service interne dedie.</span></div><Badge value="Extensible" /></li>
        </ul>
      </Card>
    </>
  )
}

export function ExamSchedulePage() {
  return (
    <>
      <PageHeader title="Calendrier des examens" subtitle="Sessions et salles d'examen." />
      <RoleScopeNote module="exams" />
      <Card><ul className="list">{events.filter((e) => e.type === 'exam').map((exam) => <li key={exam.id}>{exam.title} - {exam.date} - {exam.location}</li>)}</ul></Card>
      <Card title="Regles de session">
        <ul className="list">
          <li className="forum-item"><div><strong>Publication</strong><span>Calendrier publie par scolarite via service examens.</span></div><Badge value="Admin" type="info" /></li>
          <li className="forum-item"><div><strong>Consultation</strong><span>Acces etudiant securise avec suivi des changements.</span></div><Badge value="Trace" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function ForumPage() {
  const { rolePrefix } = useParams()
  const base = rolePrefix ? `/${rolePrefix}` : ''
  return (
    <>
      <PageHeader title="Forum et entraide" subtitle="Discussions academiques et communautaires." />
      <RoleScopeNote module="forum" />
      <div className="toolbar"><SearchField placeholder="Rechercher un sujet..." /><Link to={`${base}/forum/thread`} className="primary-btn">Voir une discussion</Link></div>
      <Card><ul className="list">{forumTopics.map((topic) => <li key={topic.id} className="forum-item"><div><strong>{topic.title}</strong><span>{topic.author} - {topic.replies} reponses</span></div><Badge value={topic.tag} /></li>)}</ul>
        <div className="toolbar"><button className="ghost-btn small">1</button><button className="ghost-btn small">2</button><button className="ghost-btn small">3</button></div>
      </Card>
      <Card title="Conformite Microservice - Forum et chat">
        <ul className="list">
          <li className="forum-item"><div><strong>Objectif</strong><span>Communication pedagogique entre etudiants et enseignants.</span></div><Badge value="Forum" type="info" /></li>
          <li className="forum-item"><div><strong>Temps reel</strong><span>Interface prete pour integration WebSocket/Firebase.</span></div><Badge value="Chat" /></li>
        </ul>
      </Card>
    </>
  )
}

export function ThreadPage() {
  return (
    <>
      <PageHeader title="Discussion forum" subtitle="Thread detaille avec reponses." />
      <RoleScopeNote module="forum" />
      <Card>
        <p><strong>Sujet:</strong> Comment organiser la revision des examens finaux ?</p>
        <p className="muted">Reponses simulees de la communaute et des enseignants.</p>
        <div className="thread-replies">
          <div>
            <strong>Yassine A.</strong>
            <p>Je recommande un planning sur 3 semaines avec priorisation des matieres a coefficient eleve.</p>
          </div>
          <div>
            <strong>Pr. Benaissa</strong>
            <p>Concentrez-vous sur les annales et TP. Publiez vos questions sur le forum chaque mardi.</p>
          </div>
        </div>
      </Card>
    </>
  )
}

export function AssistantPage() {
  return (
    <>
      <PageHeader title="Assistant IA et support" subtitle="Assistance ENT intelligente et co-navigation." />
      <RoleScopeNote module="assistant" />
      <Card>
        <div className="chat-window">
          <p><strong>Assistant:</strong> Bonjour, je peux vous aider pour les cours, examens et demarches.</p>
          <p><strong>Vous:</strong> Comment acceder aux ressources du module Frontend ?</p>
        </div>
        <div className="assistant-actions"><button className="ghost-btn">Envoyez-nous un message</button><button className="primary-btn">Rejoindre la co-navigation</button></div>
      </Card>
      <Card title="Conformite IA du projet">
        <ul className="list">
          <li className="forum-item"><div><strong>Moteur IA cible</strong><span>Ollama en cloud prive EST Sale.</span></div><Badge value="Ollama" type="success" /></li>
          <li className="forum-item"><div><strong>Modeles</strong><span>Llama 3 8B/70B instruct pour assistant conversationnel.</span></div><Badge value="Llama 3" type="info" /></li>
          <li className="forum-item"><div><strong>Usage ENT</strong><span>Aide aux cours, examens, demarches et recherche de ressources.</span></div><Badge value="Conversationnel" /></li>
        </ul>
      </Card>
    </>
  )
}

export function ExamsPage() {
  return (
    <>
      <PageHeader title="Examens" subtitle="Sessions a venir et preparation." />
      <RoleScopeNote module="exams" />
      <Card><ul className="list">{events.filter((e) => e.type === 'exam').map((exam) => <li key={exam.id}>{exam.title} - {exam.date}</li>)}</ul></Card>
      <Card title="Conformite Microservice - Examens et devoirs">
        <ul className="list">
          <li className="forum-item"><div><strong>Fonctions</strong><span>Soumission, correction et notation en ligne.</span></div><Badge value="Spec PDF" type="info" /></li>
          <li className="forum-item"><div><strong>Securite</strong><span>Acces reserve selon role avec verification JWT.</span></div><Badge value="JWT" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function AssignmentsPage() {
  const { currentRole } = useAppContext()
  return (
    <>
      <PageHeader title="Devoirs et soumissions" subtitle="Suivi des assignments et depots." />
      <RoleScopeNote module="exams" />
      <Card>
        <table className="table"><thead><tr><th>Devoir</th><th>Cours</th><th>Echeance</th><th>Statut</th><th></th></tr></thead><tbody>
          {assignments.map((assignment) => <tr key={assignment.id}><td>{assignment.title}</td><td>{assignment.course}</td><td>{assignment.dueDate}</td><td><Badge value={assignment.status} /></td><td><button className="ghost-btn small">{currentRole === 'teacher' ? 'Corriger' : currentRole === 'admin' ? 'Verifier' : 'Soumettre'}</button></td></tr>)}
        </tbody></table>
      </Card>
      <Card title="Workflow pedagogique">
        <ul className="timeline">
          <li><span>1</span> Publication du devoir par enseignant</li>
          <li><span>2</span> Soumission etudiant via ENT</li>
          <li><span>3</span> Evaluation et retour enseignant</li>
          <li><span>4</span> Publication de note/resultat</li>
        </ul>
      </Card>
    </>
  )
}

export function GradesPage() {
  return (
    <>
      <PageHeader title="Notes et resultats" subtitle="Resultats des evaluations." />
      <RoleScopeNote module="exams" />
      <Card><ul className="list">{assignments.map((item) => <li key={item.id}>{item.title} - {item.grade ?? 'En attente'}</li>)}</ul></Card>
      <Card title="Conformite notation">
        <ul className="list">
          <li className="forum-item"><div><strong>Cycle evaluation</strong><span>Soumission, correction, notation et publication des resultats.</span></div><Badge value="Examens & devoirs" type="info" /></li>
          <li className="forum-item"><div><strong>Integrite</strong><span>Acces protege et historise par role.</span></div><Badge value="Securise" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

function ProfileCard({ roleLabel, userIndex }: { roleLabel: string; userIndex: number }) {
  const { rolePrefix } = useParams()
  const base = rolePrefix ? `/${rolePrefix}` : ''
  const user = users[userIndex]
  return (
    <Card title={`Profil ${roleLabel}`}>
      <p><strong>{user.name}</strong></p>
      <p>{user.email}</p>
      <p>{user.faculty}</p>
      <p>{user.level}</p>
      <Link to={`${base}/profiles/edit`} className="sub-link">Modifier profil</Link>
    </Card>
  )
}

export function StudentProfilePage() {
  return (
    <>
      <PageHeader title="Profil etudiant" subtitle="Microservice gestion des utilisateurs." />
      <RoleScopeNote module="profile" />
      <ProfileCard roleLabel="etudiant" userIndex={0} />
    </>
  )
}
export function TeacherProfilePage() {
  return (
    <>
      <PageHeader title="Profil enseignant" subtitle="Microservice gestion des utilisateurs." />
      <RoleScopeNote module="profile" />
      <ProfileCard roleLabel="enseignant" userIndex={1} />
    </>
  )
}
export function AdminProfilePage() {
  return (
    <>
      <PageHeader title="Profil admin" subtitle="Microservice gestion des utilisateurs." />
      <RoleScopeNote module="profile" />
      <ProfileCard roleLabel="admin" userIndex={2} />
    </>
  )
}

export function EditProfilePage() {
  return (
    <>
      <PageHeader title="Edition du profil" subtitle="Mise a jour des informations utilisateur." />
      <RoleScopeNote module="profile" />
      <Card><form className="stack"><input placeholder="Nom complet" defaultValue={users[0].name} /><input placeholder="Email" defaultValue={users[0].email} /><input placeholder="Filiere" defaultValue={users[0].faculty} /><button className="primary-btn" type="button">Enregistrer</button></form></Card>
      <Card title="Conformite profils utilisateurs">
        <ul className="list">
          <li className="forum-item"><div><strong>Roles pris en charge</strong><span>Etudiant, enseignant et administrateur.</span></div><Badge value="Spec PDF" type="info" /></li>
          <li className="forum-item"><div><strong>Authentification</strong><span>Edition profile reservee aux comptes authentifies.</span></div><Badge value="OAuth2/Keycloak" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function AdminValidateAccountsPage() {
  const { currentRole } = useAppContext()
  const [items, setItems] = useState<PendingAccount[]>([])
  const [history, setHistory] = useState<Array<{
    id: string
    email: string
    action: 'APPROVED' | 'REJECTED'
    at: string
  }>>([])
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | 'APPROVED' | 'REJECTED'>('all')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = async () => {
    setPending(true)
    setError(null)
    try {
      const rows = await listPendingAccounts()
      setItems(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible')
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    if (currentRole !== 'admin') return
    void load()
    const timer = setInterval(() => void load(), 15000)
    return () => clearInterval(timer)
  }, [currentRole])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          item.email.toLowerCase().includes(q) ||
          `${item.first_name} ${item.last_name}`.toLowerCase().includes(q)
        )
      }),
    [items, query],
  )

  const filteredHistory = useMemo(
    () =>
      history.filter((entry) => {
        const q = query.trim().toLowerCase()
        const matchesQuery = !q || entry.email.toLowerCase().includes(q)
        const matchesAction = actionFilter === 'all' || entry.action === actionFilter
        return matchesQuery && matchesAction
      }),
    [history, query, actionFilter],
  )

  if (currentRole !== 'admin') {
    return (
      <>
        <PageHeader title="Approbation des comptes" subtitle="Section reservee aux administrateurs." />
        <ErrorState message="Acces refuse: cette page est reservee au role ADMIN." />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Approbation des comptes" subtitle="Approuver ou refuser les comptes etudiants en attente." />
      <RoleScopeNote module="admin" />
      <div className="grid cols-4">
        <Card>
          <p className="muted">En attente</p>
          <h2>{items.length}</h2>
        </Card>
        <Card>
          <p className="muted">Approuves (session)</p>
          <h2>{history.filter((x) => x.action === 'APPROVED').length}</h2>
        </Card>
        <Card>
          <p className="muted">Refuses (session)</p>
          <h2>{history.filter((x) => x.action === 'REJECTED').length}</h2>
        </Card>
        <Card>
          <p className="muted">Total actions (session)</p>
          <h2>{history.length}</h2>
        </Card>
      </div>
      <Card>
        <div className="toolbar">
          <button className="ghost-btn" type="button" disabled={pending} onClick={() => void load()}>
            {pending ? 'Actualisation...' : 'Actualiser la liste'}
          </button>
          <SearchField placeholder="Rechercher par email / nom..." value={query} onChange={setQuery} />
          {success ? <Badge value={success} type="success" /> : null}
        </div>
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {!filteredItems.length && !pending ? (
          <EmptyState message="Aucun compte en attente pour le moment." />
        ) : null}
        <div className="list">
          {filteredItems.map((item) => (
            <div key={item.id} className="message-item">
              <div>
                <strong>{item.email}</strong>
                <span>
                  {(item.first_name || item.last_name)
                    ? `${item.first_name} ${item.last_name}`.trim()
                    : 'Nom non renseigne'}
                </span>
                <span>Statut: {item.status}</span>
                {item.provision_source ? (
                  <span>Origine: {item.provision_source === 'admin-provision' ? 'Administrateur' : item.provision_source}</span>
                ) : null}
                {item.validation_requested_at ? (
                  <span>Demande utilisateur: {new Date(item.validation_requested_at).toLocaleString()}</span>
                ) : null}
              </div>
              <div className="toolbar">
                <button
                  className="primary-btn"
                  type="button"
                  onClick={async () => {
                    setError(null)
                    setSuccess(null)
                    try {
                      const msg = await approvePendingAccount(item.id)
                      setSuccess(msg)
                      setHistory((prev) => [
                        {
                          id: item.id,
                          email: item.email,
                          action: 'APPROVED',
                          at: new Date().toISOString(),
                        },
                        ...prev,
                      ])
                      setItems((prev) => prev.filter((x) => x.id !== item.id))
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Validation impossible')
                    }
                  }}
                >
                  Valider
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={async () => {
                    setError(null)
                    setSuccess(null)
                    try {
                      const msg = await rejectPendingAccount(item.id)
                      setSuccess(msg)
                      setHistory((prev) => [
                        {
                          id: item.id,
                          email: item.email,
                          action: 'REJECTED',
                          at: new Date().toISOString(),
                        },
                        ...prev,
                      ])
                      setItems((prev) => prev.filter((x) => x.id !== item.id))
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Refus impossible')
                    }
                  }}
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Historique des decisions (session en cours)">
        <div className="toolbar">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as 'all' | 'APPROVED' | 'REJECTED')}>
            <option value="all">Toutes actions</option>
            <option value="APPROVED">Approuve</option>
            <option value="REJECTED">Refuse</option>
          </select>
          <Badge value={`${filteredHistory.length} element(s)`} />
        </div>
        {!filteredHistory.length ? (
          <EmptyState message="Aucune action encore enregistree." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((entry) => (
                <tr key={`${entry.id}-${entry.at}`}>
                  <td>{entry.email}</td>
                  <td>
                    <Badge value={entry.action === 'APPROVED' ? 'Approuve' : 'Refuse'} type={entry.action === 'APPROVED' ? 'success' : 'warning'} />
                  </td>
                  <td>{new Date(entry.at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  )
}

export function AdminUsersPage() {
  const { currentRole } = useAppContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<AppRealmRole>('STUDENT')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (currentRole !== 'admin') {
    return (
      <>
        <PageHeader title="Administration - Utilisateurs" subtitle="Gestion des comptes et roles." />
        <RoleScopeNote module="admin" />
        <ErrorState message="Acces reserve a un compte administrateur." />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Administration - Utilisateurs" subtitle="Creation de comptes et gestion des roles." />
      <RoleScopeNote module="admin" />
      <Card title="Creer un compte (validation requise)">
        <p className="muted">
          Le compte est cree desactive jusqu&apos;a approbation dans <Link to="/admin/account-approvals">Approbation des comptes</Link>.
        </p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setSuccess(null)
            if (!authApiConfigured()) {
              setError('Definir VITE_AUTH_API_URL (ex: http://localhost:8000)')
              return
            }
            if (password !== confirm) {
              setError('Les mots de passe ne correspondent pas.')
              return
            }
            if (password.length < 8) {
              setError('Le mot de passe doit contenir au moins 8 caracteres.')
              return
            }
            setPending(true)
            try {
              const res = await adminCreateUserRequest(email, password, firstName, lastName, role)
              setSuccess(res.message)
              setEmail('')
              setPassword('')
              setConfirm('')
              setFirstName('')
              setLastName('')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Creation impossible')
            } finally {
              setPending(false)
            }
          }}
        >
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="state success" role="status">
              {success}
            </p>
          ) : null}
          <div className="grid cols-2">
            <label className="field">
              <span>Prenom</span>
              <input value={firstName} onChange={(ev) => setFirstName(ev.target.value)} placeholder="Prenom" />
            </label>
            <label className="field">
              <span>Nom</span>
              <input value={lastName} onChange={(ev) => setLastName(ev.target.value)} placeholder="Nom" />
            </label>
          </div>
          <label className="field">
            <span>Email institutionnel</span>
            <input type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="prenom.nom@estsale.ma" required />
          </label>
          <label className="field">
            <span>Role realm</span>
            <select value={role} onChange={(ev) => setRole(ev.target.value as AppRealmRole)}>
              <option value="STUDENT">Etudiant</option>
              <option value="TEACHER">Enseignant</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </label>
          <div className="grid cols-2">
            <label className="field">
              <span>Mot de passe (min. 8)</span>
              <input type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} required minLength={8} />
            </label>
            <label className="field">
              <span>Confirmer</span>
              <input type="password" value={confirm} onChange={(ev) => setConfirm(ev.target.value)} required minLength={8} />
            </label>
          </div>
          <button className="primary-btn" type="submit" disabled={pending}>
            {pending ? 'Creation...' : 'Creer le compte'}
          </button>
        </form>
      </Card>
      <Card title="Apercu (donnees de demonstration)">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Conformite Microservice - Administration">
        <ul className="list">
          <li className="forum-item">
            <div>
              <strong>Creation comptes</strong>
              <span>Reservee aux administrateurs; validation sur la file d&apos;attente.</span>
            </div>
            <Badge value="Admin" type="info" />
          </li>
          <li className="forum-item">
            <div>
              <strong>Controle d&apos;acces</strong>
              <span>Permissions appliquees selon profil (etudiant/enseignant/admin).</span>
            </div>
            <Badge value="RBAC" type="success" />
          </li>
        </ul>
      </Card>
    </>
  )
}

export function AdminRolesPage() {
  const { currentRole } = useAppContext()
  if (currentRole !== 'admin') {
    return (
      <>
        <PageHeader title="Administration - Roles" subtitle="Configuration des permissions." />
        <RoleScopeNote module="admin" />
        <ErrorState message="Acces reserve a un compte administrateur." />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Administration - Roles" subtitle="Configuration des permissions." />
      <RoleScopeNote module="admin" />
      <Card><ul className="list"><li>Etudiant - consultation, soumission, messagerie</li><li>Enseignant - publication, evaluation, moderation</li><li>Admin - gestion globale, supervision systeme</li></ul></Card>
      <Card title="Conformite securite">
        <ul className="list">
          <li className="forum-item"><div><strong>Mecanisme</strong><span>Controle d'acces base sur OAuth2 + JWT.</span></div><Badge value="Keycloak" type="info" /></li>
          <li className="forum-item"><div><strong>Principe</strong><span>Chaque microservice valide le token et les droits.</span></div><Badge value="Zero trust service" type="success" /></li>
        </ul>
      </Card>
    </>
  )
}

export function AdminStatisticsPage() {
  const { currentRole } = useAppContext()
  if (currentRole !== 'admin') {
    return (
      <>
        <PageHeader title="Administration - Statistiques" subtitle="Indicateurs ENT en temps reel (mock)." />
        <RoleScopeNote module="admin" />
        <ErrorState message="Acces reserve a un compte administrateur." />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Administration - Statistiques" subtitle="Indicateurs ENT en temps reel (mock)." />
      <RoleScopeNote module="admin" />
      <div className="grid cols-4">
        {adminStats.map((stat) => (
          <Card key={stat.label}>
            <p className="muted">{stat.label}</p>
            <h2>{stat.value}</h2>
            <Badge value={stat.trend} type="success" />
            <div className="progress-line"><span style={{ width: `${Math.min(95, Math.max(35, stat.value.length * 12))}%` }} /></div>
          </Card>
        ))}
      </div>
      <div className="grid cols-2">
        <Card title="Repartition usage ENT">
          <div className="mini-chart admin">
            <div style={{ height: '72%' }} />
            <div style={{ height: '84%' }} />
            <div style={{ height: '61%' }} />
            <div style={{ height: '90%' }} />
            <div style={{ height: '54%' }} />
          </div>
          <div className="chart-labels"><span>Etu</span><span>Ens</span><span>Adm</span><span>Invites</span><span>Guests</span></div>
        </Card>
        <Card title="Sante plateforme">
          <ul className="list">
            <li className="forum-item"><div><strong>Disponibilite API Gateway</strong><span>99.98%</span></div><Badge value="Stable" type="success" /></li>
            <li className="forum-item"><div><strong>Temps de reponse moyen</strong><span>184 ms</span></div><Badge value="Optimal" type="info" /></li>
            <li className="forum-item"><div><strong>Charge serveur documents</strong><span>71%</span></div><Badge value="Surveille" type="warning" /></li>
          </ul>
        </Card>
      </div>
      <Card title="Conformite observabilite">
        <div className="chips">
          <span className="chip">Monitoring</span>
          <span className="chip">Logging</span>
          <span className="chip">Tracing</span>
          <span className="chip">CI/CD</span>
          <span className="chip">Scalabilite</span>
        </div>
      </Card>
    </>
  )
}

export function AdminSystemOverviewPage() {
  const { currentRole } = useAppContext()
  if (currentRole !== 'admin') {
    return (
      <>
        <PageHeader title="Administration - Vue systeme" subtitle="Etat des services et incidents." />
        <RoleScopeNote module="admin" />
        <ErrorState message="Acces reserve a un compte administrateur." />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Administration - Vue systeme" subtitle="Etat des services et incidents." />
      <RoleScopeNote module="admin" />
      <div className="grid cols-3">
        <Card title="Etat services"><LoadingState /></Card>
        <Card title="Incidents"><EmptyState message="Aucun incident critique en cours." /></Card>
        <Card title="Logs critiques"><ErrorState message="Erreur mock de service de stockage (simulation)." /></Card>
      </div>
      <Card title="Architecture cible (rappel cahier des charges)">
        <div className="chips">
          <span className="chip">Ubuntu 24.10</span>
          <span className="chip">VMware ESXi</span>
          <span className="chip">Docker</span>
          <span className="chip">Kubernetes</span>
          <span className="chip">API REST</span>
          <span className="chip">Observabilite</span>
        </div>
      </Card>
    </>
  )
}
