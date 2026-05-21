/**
 * 管理ルート（/#/admin）を有効にする。
 * 本番では VITE_ENABLE_ADMIN=true のときのみ（タイトルのリンクは出さない）。
 */
export const ADMIN_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true'
