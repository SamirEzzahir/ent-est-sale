import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { HelpCircle, LifeBuoy, MailCheck, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { entContent } from '../config/content'
import { authApiConfigured, submitValidationRequest } from '../lib/authApi'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!isSessionReady || !isAuthenticated) return
    navigate(`/${currentRole}/dashboard`, { replace: true })
  }, [isSessionReady, isAuthenticated, currentRole, navigate])

  return (
    <AuthShell title="Connexion au portail ENT" subtitle="Accedez a votre espace universitaire securise.">
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setPending(true)
          try {
            const role = await login(email.trim(), password)
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
          <span>Email institutionnel</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="prenom.nom@estsale.ma"
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
        <button className="primary-btn" type="submit" disabled={pending}>
          {pending ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <div className="links-row">
        <Link to="/forgot-password">Mot de passe oublie</Link>
        <Link to="/validate-account">Demander la validation de mon compte</Link>
      </div>
      <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
        Les comptes sont crees par l&apos;administration. Si vous avez recu un identifiant, utilisez la demande de validation une fois votre compte prepare.
      </p>
      <Link to="/help" className="sub-link">
        <HelpCircle size={15} /> Besoin d'aide ?
      </Link>
    </AuthShell>
  )
}

export function RegistrationClosedPage() {
  return (
    <AuthShell
      title="Creation de compte"
      subtitle="L'inscription en ligne est desactivee pour des raisons de securite."
    >
      <div className="stack">
        <p className="state success" role="status">
          <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Seuls les administrateurs peuvent creer un compte sur la plateforme ENT.
        </p>
        <p className="muted">
          Si votre etablissement vous a attribue un compte qui est encore en attente de validation, utilisez la page{' '}
          <Link to="/validate-account">Demander la validation</Link> pour signaler votre demande aux administrateurs.
        </p>
        <div className="links-row">
          <Link to="/">Retour a la connexion</Link>
          <Link to="/validate-account">Demander la validation de mon compte</Link>
        </div>
      </div>
    </AuthShell>
  )
}

export function ForgotPasswordPage() {
  return (
    <AuthShell title="Reinitialiser le mot de passe" subtitle="Saisissez votre email pour recevoir un lien de recuperation.">
      <form className="stack">
        <label className="field">
          <span>Email institutionnel</span>
          <input placeholder="prenom.nom@estsale.ma" />
        </label>
        <button className="primary-btn" type="button">
          Envoyer le lien
        </button>
      </form>
      <Link to="/" className="sub-link">
        Retour a la connexion
      </Link>
    </AuthShell>
  )
}

export function ValidateAccountPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title="Demande de validation de compte"
      subtitle="Reserve aux comptes deja crees par l'administration et encore en attente d'activation."
    >
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
          setPending(true)
          try {
            const res = await submitValidationRequest(email, message)
            setSuccess(res.message)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Envoi impossible')
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
            <MailCheck size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {success}
          </p>
        ) : null}
        <label className="field">
          <span>Email institutionnel du compte</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="prenom.nom@estsale.ma"
            required
          />
        </label>
        <label className="field">
          <span>Message (optionnel)</span>
          <textarea
            name="message"
            rows={4}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="Ex: service, promotion, ou precision pour l'administrateur..."
            maxLength={2000}
          />
        </label>
        <button className="primary-btn" type="submit" disabled={pending}>
          {pending ? 'Envoi...' : 'Envoyer la demande de validation'}
        </button>
      </form>
      <p className="muted">
        Un administrateur traitera votre demande depuis l&apos;espace ENT. Vous pourrez vous connecter une fois le compte valide.
      </p>
      <div className="links-row">
        <Link to="/">Retour a la connexion</Link>
        <Link to="/help">Besoin d&apos;aide ?</Link>
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
