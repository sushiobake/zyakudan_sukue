# pre-ds-import backup（Design System 取り込み直前）

作成: 2026-05-19

## 含まれるファイル

- `src/App.css`, `src/index.css`, `src/App.tsx`
- `src/game/GameApp.tsx`
- `src/admin/AdminApp.tsx`, `src/admin/Admin.css`

## 復元（PowerShell・プロジェクトルートで）

```powershell
Copy-Item "backup\pre-ds-import-20260519-185222\src\App.css" "src\App.css" -Force
Copy-Item "backup\pre-ds-import-20260519-185222\src\index.css" "src\index.css" -Force
Copy-Item "backup\pre-ds-import-20260519-185222\src\App.tsx" "src\App.tsx" -Force
Copy-Item "backup\pre-ds-import-20260519-185222\src\game\GameApp.tsx" "src\game\GameApp.tsx" -Force
Copy-Item "backup\pre-ds-import-20260519-185222\src\admin\AdminApp.tsx" "src\admin\AdminApp.tsx" -Force
Copy-Item "backup\pre-ds-import-20260519-185222\src\admin\Admin.css" "src\admin\Admin.css" -Force
Remove-Item "src\title.css" -ErrorAction SilentlyContinue
Remove-Item "public\mark.svg" -ErrorAction SilentlyContinue
```

`index.html` の favicon を `/favicon.svg` に戻す場合は手動で。
