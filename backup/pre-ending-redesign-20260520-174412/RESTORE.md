# 結果画面リデザイン前バックアップ

作成: 2026-05-20

## 含まれるファイル

- `App.css` … リデザイン直前の `src/App.css` 全文

## 復元（PowerShell・プロジェクトルート）

```powershell
Copy-Item "backup\pre-ending-redesign-20260520-174412\App.css" "src\App.css" -Force
```

エンディング部分だけ戻す場合は、バックアップ内 `App.css` の `/* ----- エンディング ----- */` 以降をコピーしてください。
