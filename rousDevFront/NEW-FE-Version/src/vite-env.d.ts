/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_API_URL?: string
  readonly VITE_ADMIN_API_URL?: string
  readonly VITE_UPLOAD_API_URL?: string
  readonly VITE_DOWNLOAD_API_URL?: string
  readonly VITE_AI_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
