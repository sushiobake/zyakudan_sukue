/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_ADMIN?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_SAVE_CONTENT_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
