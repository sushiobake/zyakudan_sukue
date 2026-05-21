/**
 * 管理画面（/#/admin）はローカル開発時のみ。
 * 本番サイトには含めず、プレイ履歴・問題編集はすべてローカルから行う。
 */
export const ADMIN_ENABLED = import.meta.env.DEV
