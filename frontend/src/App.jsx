import { useEffect, useState } from 'react'
import './App.css'

const API = {
  auth: '/api/auth',
  upload: '/api/upload',
  download: '/api/download',
  admin: '/api/admin',
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function readResponseData(res) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  const text = await res.text()
  return { detail: text || `HTTP ${res.status}` }
}

function LoginPage() {
  const [error, setError] = useState('')
  const [redirecting, setRedirecting] = useState(false)

  async function handleKeycloakLogin() {
    setError('')
    setRedirecting(true)
    try {
      const redirectUri = `${window.location.origin}/auth/callback`
      const res = await fetch(`${API.auth}/login/keycloak?redirect_uri=${encodeURIComponent(redirectUri)}`)
      const data = await readResponseData(res)
      if (!res.ok) throw new Error(data.detail || 'Impossible de preparer la connexion Keycloak')
      window.location.href = data.login_url
    } catch (err) {
      setError(err.message)
      setRedirecting(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle">ENT</div>
          <h1>EST Sale</h1>
          <p>Espace Numerique de Travail</p>
        </div>
        <div className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          <p>Authentification centralisee avec Keycloak.</p>
          <button type="button" className="btn btn-primary btn-full" disabled={redirecting} onClick={handleKeycloakLogin}>
            {redirecting ? 'Redirection...' : 'Se connecter avec Keycloak'}
          </button>
        </div>
        <div className="login-hint">
          <small>Comptes Keycloak precharges : admin/admin123 · teacher1/teacher123 · student1/student123</small>
        </div>
      </div>
    </div>
  )
}

function Navbar({ user, onLogout }) {
  const roleLabel = { admin: 'Administrateur', teacher: 'Enseignant', student: 'Etudiant' }
  const roleBadge = { admin: 'badge-admin', teacher: 'badge-teacher', student: 'badge-student' }
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="nav-logo">ENT</span>
        <span className="nav-title">EST Sale</span>
      </div>
      <div className="navbar-user">
        <span className={`badge ${roleBadge[user.role]}`}>{roleLabel[user.role]}</span>
        <span className="nav-username">{user.username}</span>
        <button className="btn btn-sm btn-outline" onClick={onLogout}>Deconnexion</button>
      </div>
    </nav>
  )
}

function StudentView({ session }) {
  const { access_token: token, role, username } = session
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadMsg, setDownloadMsg] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ course_name: '', filename: '' })

  function canManage(file) {
    return role === 'admin' || (role === 'teacher' && file.uploaded_by === username)
  }

  function loadFiles() {
    setLoading(true)
    fetch(`${API.download}/files`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFiles(data)
          setError('')
        } else setError(data.detail || 'Erreur lors du chargement')
      })
      .catch(() => setError('Impossible de contacter le service de telechargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFiles()
  }, [token])

  async function handleDownload(fileId, filename) {
    setDownloadMsg('')
    try {
      const res = await fetch(`${API.download}/files/${fileId}/download`, {
        headers: authHeaders(token),
      })
      const data = await readResponseData(res)
      if (!res.ok) throw new Error('Impossible de generer le lien')
      window.open(data.download_url, '_blank')
      setDownloadMsg(`Lien genere pour "${filename}"`)
    } catch (err) {
      setDownloadMsg(`Erreur : ${err.message}`)
    }
  }

  function startEdit(file) {
    setEditingId(file.id)
    setEditForm({ course_name: file.course_name || '', filename: file.filename || '' })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ course_name: '', filename: '' })
  }

  async function handleSaveEdit(fileId) {
    setDownloadMsg('')
    try {
      const res = await fetch(`${API.download}/files/${fileId}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(editForm),
      })
      const data = await readResponseData(res)
      if (!res.ok) throw new Error(data.detail || 'Impossible de modifier la ressource')
      setFiles(current => current.map(file => (file.id === fileId ? data : file)))
      setDownloadMsg('Ressource mise a jour avec succes')
      cancelEdit()
    } catch (err) {
      setDownloadMsg(`Erreur : ${err.message}`)
    }
  }

  async function handleDelete(file) {
    if (!confirm(`Supprimer la ressource "${file.filename}" ?`)) return
    setDownloadMsg('')
    try {
      const res = await fetch(`${API.download}/files/${file.id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) {
        const data = await readResponseData(res)
        throw new Error(data.detail || 'Impossible de supprimer la ressource')
      }
      setFiles(current => current.filter(item => item.id !== file.id))
      setDownloadMsg('Ressource supprimee avec succes')
      if (editingId === file.id) cancelEdit()
    } catch (err) {
      setDownloadMsg(`Erreur : ${err.message}`)
    }
  }

  return (
    <div className="view-container">
      <h2>Ressources pedagogiques</h2>
      <p className="subtitle">Consultez et telechargez les cours disponibles</p>
      {downloadMsg && <div className="alert alert-info">{downloadMsg}</div>}
      {loading && <div className="loading">Chargement...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && files.length === 0 && (
        <div className="empty-state">Aucun fichier disponible pour le moment.</div>
      )}
      <div className="files-grid">
        {files.map(f => (
          <div key={f.id} className="file-card">
            <div className="file-icon">{fileIcon(f.filename)}</div>
            <div className="file-info">
              {editingId === f.id ? (
                <div className="file-edit-form">
                  <div className="form-group">
                    <label>Nom du fichier</label>
                    <input
                      type="text"
                      value={editForm.filename}
                      onChange={e => setEditForm(current => ({ ...current, filename: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom du cours</label>
                    <input
                      type="text"
                      value={editForm.course_name}
                      onChange={e => setEditForm(current => ({ ...current, course_name: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="file-name">{f.filename}</div>
                  <div className="file-meta">Cours : {f.course_name}</div>
                </>
              )}
              <div className="file-meta">Par : {f.uploaded_by}</div>
              <div className="file-meta">{formatDate(f.upload_date)}</div>
            </div>
            <div className="file-actions">
              <button className="btn btn-sm btn-primary" onClick={() => handleDownload(f.id, f.filename)}>
                Telecharger
              </button>
              {canManage(f) && editingId !== f.id && (
                <>
                  <button className="btn btn-sm btn-outline" onClick={() => startEdit(f)}>
                    Modifier
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f)}>
                    Supprimer
                  </button>
                </>
              )}
              {canManage(f) && editingId === f.id && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(f.id)}>
                    Enregistrer
                  </button>
                  <button className="btn btn-sm btn-outline" onClick={cancelEdit}>
                    Annuler
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeacherView({ token }) {
  const [file, setFile] = useState(null)
  const [courseName, setCourseName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info')

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('course_name', courseName || 'default')
    try {
      const res = await fetch(`${API.upload}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await readResponseData(res)
      if (!res.ok) throw new Error(data.detail || "Echec de l'upload")
      setMsg(`Fichier "${data.filename}" uploade avec succes (ID: ${data.id})`)
      setMsgType('success')
      setFile(null)
      setCourseName('')
      e.target.reset()
    } catch (err) {
      setMsg(`Erreur : ${err.message}`)
      setMsgType('error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="view-container">
      <h2>Deposer un fichier de cours</h2>
      <p className="subtitle">Partagez vos ressources pedagogiques avec les etudiants</p>
      {msg && <div className={`alert alert-${msgType}`}>{msg}</div>}
      <div className="upload-card">
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Nom du cours</label>
            <input
              type="text"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              placeholder="ex: Algorithmique S3"
            />
          </div>
          <div className="form-group">
            <label>Fichier</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-upload"
                onChange={e => setFile(e.target.files[0])}
                accept=".pdf,.txt,.docx,.pptx,.xlsx,.jpg,.jpeg,.png"
                required
              />
              <label htmlFor="file-upload" className="file-input-label">
                {file ? file.name : 'Choisir un fichier (PDF, DOCX, PPTX...)'}
              </label>
            </div>
            <small>Formats acceptes : PDF, TXT, DOCX, PPTX, XLSX, JPG, PNG (max 100 Mo)</small>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
            {uploading ? 'Upload en cours...' : 'Uploader le fichier'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminView({ token }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'student', email: '' })

  function loadUsers() {
    setLoading(true)
    fetch(`${API.admin}/users`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data)
        else setError(data.detail || 'Erreur')
      })
      .catch(() => setError('Impossible de contacter le service admin'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [token])

  async function handleCreate(e) {
    e.preventDefault()
    setMsg('')
    try {
      const res = await fetch(`${API.admin}/users`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(newUser),
      })
      const data = await readResponseData(res)
      if (!res.ok) throw new Error(data.detail || 'Echec de la creation')
      setMsg(`Utilisateur "${data.username}" cree avec succes`)
      setShowCreate(false)
      setNewUser({ username: '', password: '', role: 'student', email: '' })
      loadUsers()
    } catch (err) {
      setMsg(`Erreur : ${err.message}`)
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await fetch(`${API.admin}/users/${userId}/roles`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ role: newRole }),
      })
      const data = await readResponseData(res)
      if (!res.ok) throw new Error(data.detail || 'Echec')
      setMsg(`Role mis a jour pour ${data.username}`)
      loadUsers()
    } catch (err) {
      setMsg(`Erreur : ${err.message}`)
    }
  }

  async function handleDelete(userId, username) {
    if (!confirm(`Supprimer l'utilisateur "${username}" ?`)) return
    try {
      const res = await fetch(`${API.admin}/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) {
        const data = await readResponseData(res)
        throw new Error(data.detail || 'Echec')
      }
      loadUsers()
    } catch (err) {
      setMsg(`Erreur : ${err.message}`)
    }
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Gestion des utilisateurs</h2>
          <p className="subtitle">Creez et gerez les comptes de la plateforme</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Annuler' : '+ Nouvel utilisateur'}
        </button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('Erreur') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      {showCreate && (
        <div className="create-form-card">
          <h3>Creer un utilisateur</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input type="password" value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="student">Etudiant</option>
                  <option value="teacher">Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email (optionnel)</label>
                <input type="email" value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Creer</button>
          </form>
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td>
                  <select
                    className={`role-select role-${u.role}`}
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="student">Etudiant</option>
                    <option value="teacher">Enseignant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id, u.username)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function fileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase()
  const icons = { pdf: 'PDF', docx: 'DOC', pptx: 'PPT', xlsx: 'XLS', jpg: 'IMG', jpeg: 'IMG', png: 'IMG', txt: 'TXT' }
  return icons[ext] || 'FILE'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('fr-FR') } catch { return dateStr }
}

function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState(session.role === 'admin' ? 'admin' : session.role === 'teacher' ? 'upload' : 'courses')

  const tabs = {
    student: [{ id: 'courses', label: 'Cours' }],
    teacher: [{ id: 'courses', label: 'Cours' }, { id: 'upload', label: 'Deposer un fichier' }],
    admin: [{ id: 'courses', label: 'Cours' }, { id: 'upload', label: 'Deposer' }, { id: 'admin', label: 'Utilisateurs' }],
  }

  const currentTabs = tabs[session.role] || tabs.student

  return (
    <div className="app-layout">
      <Navbar user={session} onLogout={onLogout} />
      <div className="tab-bar">
        {currentTabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <main className="main-content">
        {activeTab === 'courses' && <StudentView session={session} />}
        {activeTab === 'upload' && <TeacherView token={session.access_token} />}
        {activeTab === 'admin' && <AdminView token={session.access_token} />}
      </main>
    </div>
  )
}

function AuthCallback({ onLogin }) {
  const [error, setError] = useState('')

  useEffect(() => {
    async function finishLogin() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (!code) {
        setError('Code Keycloak manquant dans le callback')
        return
      }

      try {
        const redirectUri = `${window.location.origin}/auth/callback`
        const res = await fetch(
          `${API.auth}/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`
        )
        const data = await readResponseData(res)
        if (!res.ok) throw new Error(data.detail || 'Echec du callback Keycloak')
        onLogin(data)
        window.history.replaceState({}, '', '/')
      } catch (err) {
        setError(err.message)
      }
    }

    finishLogin()
  }, [onLogin])

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Connexion Keycloak</h1>
        {error ? <div className="alert alert-error">{error}</div> : <p>Connexion en cours...</p>}
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('ent_session')) } catch { return null }
  })

  function handleLogin(data) {
    sessionStorage.setItem('ent_session', JSON.stringify(data))
    setSession(data)
  }

  async function handleLogout() {
    sessionStorage.removeItem('ent_session')
    setSession(null)
    try {
      const postLogoutRedirectUri = `${window.location.origin}/`
      const res = await fetch(
        `${API.auth}/logout/keycloak?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
      )
      const data = await readResponseData(res)
      if (res.ok && data.logout_url) {
        window.location.href = data.logout_url
      }
    } catch {
      // Local session is already cleared; fallback silently if logout URL cannot be loaded.
    }
  }

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback onLogin={handleLogin} />
  }

  if (!session) return <LoginPage />
  return <Dashboard session={session} onLogout={handleLogout} />
}
