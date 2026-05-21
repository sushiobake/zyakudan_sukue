/** 開発時のみ管理画面を有効。本番で使うときはビルド時に VITE_ENABLE_ADMIN=true */
export const ADMIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true'
