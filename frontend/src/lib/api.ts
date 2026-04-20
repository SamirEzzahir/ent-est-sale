export function resolveApiBase(envValue: string | undefined, fallback: string): string {
  const trimmed = envValue?.trim()
  if (!trimmed) return fallback
  return trimmed.replace(/\/$/, '')
}

export async function readResponseText(response: Response): Promise<string> {
  return (await response.text()).trim()
}

export function parseApiError(text: string, status: number): string {
  if (!text) return `Erreur ${status}`
  try {
    const json = JSON.parse(text) as {
      detail?: string | Array<{ msg?: string }>
      error?: string
      error_description?: string
      message?: string
    }
    if (typeof json.detail === 'string') return json.detail
    if (Array.isArray(json.detail)) {
      const details = json.detail.map((item) => item.msg ?? JSON.stringify(item)).join(' ')
      if (details) return details
    }
    if (typeof json.error_description === 'string') return json.error_description
    if (typeof json.error === 'string') return json.error
    if (typeof json.message === 'string') return json.message
  } catch {
    // Response is plain text.
  }
  return text
}

export async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const text = await readResponseText(response)
  if (!response.ok) {
    throw new Error(parseApiError(text, response.status))
  }
  if (!text) {
    throw new Error('Reponse vide du serveur')
  }
  return JSON.parse(text) as T
}
