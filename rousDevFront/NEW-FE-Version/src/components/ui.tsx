import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card">
      {(title || action) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Badge({ value, type = 'neutral' }: { value: string; type?: 'neutral' | 'info' | 'warning' | 'success' }) {
  return <span className={`badge ${type}`}>{value}</span>
}

export function SearchField({
  placeholder = 'Rechercher...',
  value,
  onChange,
}: {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="search-field">
      <Search size={16} />
      <input placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="state empty">{message}</div>
}

export function LoadingState() {
  return <div className="state loading">Chargement...</div>
}

export function ErrorState({ message = 'Une erreur est survenue.' }: { message?: string }) {
  return <div className="state error">{message}</div>
}
