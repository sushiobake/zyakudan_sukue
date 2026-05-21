# Admin UI Kit — Content Editor

Recreation of the `#/admin` hash-route content editor — the surface the studio
uses to author scenarios, options, scores, and the live `content.json`
exported to the production game.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Interactive editor — pick a chapter, edit metadata, edit any question, all four options live. |
| `admin.css` | Production stylesheet (copied from `_source/Admin.css`). |
| `kit.css` | Reset + token import. |
| `components.jsx` | `AdminHeader`, `AdminSidebar`, `LevelCard`, `QuestionCard`, `OptionsCard`. |

Sample data is shared with the game kit — loaded from `../game/data.js`.

## Layout

Two-column sticky-header app, cream-paper aesthetic carried over from the game:

```
┌─────────────────────────────────────────────────────────────┐
│  弱者男性を救え — 管理画面                                   │  ◄ sticky, blur(10px)
│  [ゲームでプレビュー] [JSON エクスポート] [JSON インポート] │
├──────────────┬──────────────────────────────────────────────┤
│ 章           │  ─ 章の設定                                    │
│ ● 第1章      │     ID / タイトル / タグライン / アクセント色   │
│   第2章      │  ─ 問題 N / M  [削除]                          │
│   第3章      │     シチュエーション (textarea)                 │
│              │  ─ 選択肢（4つ）                                │
│ 問題（5）    │     [選択肢 1] 台詞 / 点数 / 反応 / 講評        │
│ ● Q1: ...    │     [選択肢 2] ...                              │
│   Q2: ...    │     [選択肢 3] ...                              │
│   ...        │     [選択肢 4] ...                              │
└──────────────┴──────────────────────────────────────────────┘
```

## What the kit demonstrates

- Pick / add chapters and questions
- Edit chapter metadata (`id`, `title`, `tagline`, `accent`)
- Edit a question's situation prose
- Per-option editing: text, score (100/80/60/20), heroine reaction, after-score comment
- Faux status toasts on save/export/import (no actual filesystem writes)

## Caveats

- This is a UI-only recreation: JSON import/export, localStorage preview, and
  the actual content reload-on-save handshake are stubbed. The production
  app implements them in `_source/AdminApp.tsx`.
