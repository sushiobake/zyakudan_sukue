# デプロイ・Supabase ログ設定

## Vercel 環境変数（ステップ5）

プロジェクト → **Settings** → **Environment Variables** → **Production** に追加 → **Redeploy**

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | 同画面の **service_role** secret（anon ではない） |
| `SUPABASE_EVENTS_TABLE` | `zyakudan_events` | 省略可（デフォルトこの名前） |
| `ZYAKUDAN_ADMIN_PASSWORD` | 自分で決めた長いパスワード | 管理画面「プレイ履歴」取得用 |
| `VITE_SITE_URL` | `https://あなたの.vercel.app` | OGP・X共有の絶対URL（末尾スラッシュなし） |
| `VITE_ENABLE_ADMIN` | `true` | 本番で `/#/admin` を有効にする（タイトルにリンクは出ない。URL直打ち） |

**注意:** `SUPABASE_SERVICE_ROLE_KEY` は GitHub に上げない。`VITE_` 付きだけがフロントに埋め込まれる。

## 動作確認

1. 本番 URL で1章プレイする  
2. Supabase → **Table Editor** → `zyakudan_events` に行が増える  
3. 本番 `/#/admin` → **プレイ履歴** → 管理パスワード入力 → **再読込**

## ローカル開発

プロジェクト直下に `.env.local`（git 無視）:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ZYAKUDAN_ADMIN_PASSWORD=local-dev-password
VITE_ENABLE_ADMIN=true
```

`npm run dev` で `/api/analytics` も動く（Vite ミドルウェア）。Supabase 鍵が無いとログはスキップされる。

## コマンド

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run dev:clean` | キャッシュ削除後に dev |
| `npm run build` | 本番ビルド（Vercel と同じ） |
