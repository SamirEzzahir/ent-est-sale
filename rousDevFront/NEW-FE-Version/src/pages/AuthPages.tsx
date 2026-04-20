import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { HelpCircle, LifeBuoy, LogIn, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { entContent } from '../config/content'
import { beginKeycloakLogin, completeKeycloakLogin } from '../lib/authApi'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={entContent.branding.logoPath} alt="Logo EST Sale" className="auth-logo" />
        <span className="pill">EST Sale - ENT</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
      <aside className="auth-aside">
        <h2>Espace Numerique de Travail</h2>
        <p>Portail ENT EST Sale aligne avec une architecture micro-services securisee et evolutive.</p>
        <ul>
          <li>Auth OAuth2/Keycloak + JWT</li>
          <li>Services cours/fichiers/messages/examens</li>
          <li>Assistant IA Ollama (Llama 3)</li>
        </ul>
        <div className="auth-metrics">
          <div>
            <strong>2 400+</strong>
            <span>Etudiants actifs</span>
          </div>
          <div>
            <strong>148</strong>
            <span>Modules publies</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

export function LoginPage() {
  const { login, isAuthenticated, isSessionReady, currentRole } = useAppContext()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!isSessionReady || !isAuthenticated) return
    navigate(`/${currentRole}/dashboard`, { replace: true })
  }, [isSessionReady, isAuthenticated, currentRole, navigate])

  return (
    <AuthShell title="Connexion au portail ENT" subtitle="Connectez-vous avec votre nom d'utilisateur, votre email, ou via Keycloak.">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setPending(true)
          try {
            const role = await login(identifier.trim(), password)
            navigate(`/${role}/dashboard`, { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Connexion impossible')
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
        <label className="field">
          <span>Nom d'utilisateur ou email</span>
          <input
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={(ev) => setIdentifier(ev.target.value)}
            placeholder="prenom.nom ou prenom.nom@estsale.ma"
            required
          />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="Votre mot de passe"
            required
          />
        </label>
        <button className="primary-btn" type="submit" disabled={pending || redirecting}>
          {pending ? 'Connexion...' : 'Se connecter'}
        </button>
        <button
          className="ghost-btn"
          type="button"
          disabled={pending || redirecting}
          onClick={async () => {
            setError(null)
            setRedirecting(true)
            try {
              await beginKeycloakLogin()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Redirection Keycloak impossible')
              setRedirecting(false)
            }
          }}
        >
          <LogIn size={16} /> {redirecting ? 'Redirection...' : 'Continue with Keycloak'}
        </button>
      </form>
      <div className="links-row">
        <Link to="/forgot-password">Mot de passe oublie</Link>
      </div>
      <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
        Les comptes sont administres via Keycloak. Un administrateur peut aussi provisionner un utilisateur depuis l'espace ENT.
      </p>
      <Link to="/help" className="sub-link">
        <HelpCircle size={15} /> Besoin d'aide ?
      </Link>
    </AuthShell>
  )
}

export function AuthCallbackPage() {
  const { completeLogin } = useAppContext()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const hasProcessedCallback = useRef(false)

  useEffect(() => {
    if (hasProcessedCallback.current) return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) {
      setError('Code Keycloak manquant dans le callback.')
      return
    }

    hasProcessedCallback.current = true

    void (async () => {
      try {
        const { user } = await completeKeycloakLogin(code)
        completeLogin(user)
        navigate(`/${user.role}/dashboard`, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Echec du callback Keycloak')
      }
    })()
  }, [completeLogin, navigate])

  return (
    <AuthShell title="Connexion Keycloak" subtitle="Finalisation de votre authentification...">
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="state success" role="status">
          Connexion en cours...
        </p>
      )}
      <Link to="/" className="sub-link">
        Retour a la connexion
      </Link>
    </AuthShell>
  )
}

export function RegistrationClosedPage() {
  return (
    <AuthShell title="Creation de compte" subtitle="L'inscription en ligne est desactivee pour des raisons de securite.">
      <div className="stack">
        <p className="state success" role="status">
          <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Seuls les administrateurs peuvent creer un compte sur la plateforme ENT.
        </p>
        <p className="muted">
          Le flux actif repose sur la creation de comptes par l'administrateur et l'authentification Keycloak. L'inscription publique n'est pas exposee ici.
        </p>
        <div className="links-row">
          <Link to="/">Retour a la connexion</Link>
        </div>
      </div>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  return (
    <AuthShell title="Reinitialiser le mot de passe" subtitle="Utilisez l'ecran de connexion Keycloak si votre realm a active la recuperation.">
      <div className="stack">
        <p className="muted">
          Cette interface ne gere pas encore le reset de mot de passe cote frontend. Utilisez le lien de recuperation dans Keycloak ou contactez l'administration.
        </p>
        <button className="primary-btn" type="button" onClick={() => void beginKeycloakLogin()}>
          Ouvrir Keycloak
        </button>
      </div>
      <Link to="/" className="sub-link">
        Retour a la connexion
      </Link>
    </AuthShell>
  )
}

export function ValidateAccountPage() {
  return (
    <AuthShell title="Validation de compte" subtitle="Ce flux n'est pas expose par les APIs actives.">
      <p className="muted">
        La nouvelle interface n'utilise plus de faux endpoints. Les services exposes couvrent aujourd'hui l'authentification, la creation d'utilisateurs, l'upload et la gestion des fichiers. La validation publique de compte n'est pas disponible via le backend actif.
      </p>
      <div className="links-row">
        <Link to="/">Retour a la connexion</Link>
        <Link to="/help">Besoin d'aide ?</Link>
      </div>
    </AuthShell>
  )
}

export function HelpPage() {
  return (
    <AuthShell title="Centre d'assistance ENT" subtitle="Choisissez un canal de support adapte a votre besoin.">
      <div className="stack">
        <button className="support-btn" type="button">
          <LifeBuoy size={18} /> FAQ et guides
        </button>
        <button className="support-btn" type="button">
          <LifeBuoy size={18} /> Contacter le support
        </button>
      </div>
      <Link to="/" className="sub-link">
        Retour a la connexion
      </Link>
    </AuthShell>
  )
}
