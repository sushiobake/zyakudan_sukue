# 運用の考え方（ローカル管理・本番はプレイのみ）

- **本番（Vercel）** … ゲームだけ公開。プレイログは Supabase に送信。
- **ローカル（`npm run dev`）** … 問題編集・称号・**本番のプレイ履歴**をすべてここで行う。
- **本番に管理画面はない**（`/#/admin` もビルドに含めない）。

---

## ローカルで本番のプレイ履歴を見る

1. プロジェクト直下に `.env.local` を作る（Git に上げない）:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

`ZYAKUDAN_ADMIN_PASSWORD` はローカルでは**不要**（未設定ならパスワードなしで読める）。

2. 起動:

```bash
npm run dev
```

3. ブラウザで `http://localhost:5173/#/admin` → **プレイ履歴** タブ → **再読込**

本番で誰かがプレイすると、同じ Supabase の `zyakudan_events` に溜まり、ローカルからそのまま見えます。

---

## Vercel 環境変数（本番デプロイ用）

**Settings → Environment Variables → Production** → **Redeploy**

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `SUPABASE_URL` | ○ | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ○ | service_role secret（ログ保存 API 用） |
| `VITE_SITE_URL` | 推奨 | 本番 URL（OGP・X 共有） |
| `SUPABASE_EVENTS_TABLE` | 任意 | 省略時 `zyakudan_events` |

**本番では不要（入れない）:**

- `VITE_ENABLE_ADMIN` … 管理画面はローカルのみ
- `ZYAKUDAN_ADMIN_PASSWORD` … 本番に管理 API を使わないため不要

---

## コンテンツを直して本番に反映する流れ

1. ローカル `/#/admin` で問題・称号を編集 → **保存**（`content.json` 更新）
2. 動作確認（`npm run dev` でゲームプレイ）
3. `git add` → `commit` → `push`
4. Vercel が自動ビルド・デプロイ

---

## コマンド

| コマンド | 用途 |
|----------|------|
| `npm run dev` | ゲーム + ローカル管理 + 本番ログ閲覧 |
| `npm run dev:clean` | キャッシュ削除後に dev |
| `npm run build` | 本番ビルド確認 |

---

## 動作確認

1. 本番 URL で1章プレイ  
2. Supabase → `zyakudan_events` に行が増える  
3. ローカル `/#/admin` → **プレイ履歴** で同じデータが見える  
