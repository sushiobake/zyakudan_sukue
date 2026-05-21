# Game UI Kit — Visual Novel Runtime

A pixel-faithful recreation of the sushiobake studio visual-novel runtime — the
**"弱者男性を救え！"** game.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Click-thru prototype. Title → choose chapter → 3 quiz scenes → ending. |
| `vn.css` | The production stylesheet (copied verbatim from `_source/App.css`). |
| `kit.css` | Token re-declaration + page reset so the kit stands alone. |
| `data.js` | Sample dataset (3 chapters × 3 questions, from `assets/content.json`). |
| `components.jsx` | Atoms: `BgStack`, `HudPill`, `HudHints`, `CharaSprite`, `AdvWindow`, `ChoiceOverlay`. |
| `TitleScreen.jsx` | Title screen: eyebrow, mincho heading, lead, paper-card menu. |
| `QuizScreen.jsx` | The quiz loop. Phases: `situation → choices → reaction → score`. |
| `EndingCard.jsx` | Final paper card with rank ribbon, score, share/restart actions. |

## Phases and what each shows

| `phase` | Speaker | Body | Score? |
| --- | --- | --- | --- |
| `situation` | ナレーション | scene description | – |
| `choices` | プレイヤー（神） | "彼に言わせる台詞を選ぶ。" + 4-row overlay | – |
| `reaction` | 由良 さくら (heroine) | quoted reaction | – |
| `score` | 講評 | judgement + big gradient numeral | yes |

## Heroine pose mapping

Driven by the chosen option's score:

```
score 100/80  → pose 2 (smile)
score 60     → pose 3 (shy)
score ≤ 20   → pose 4 (surprised)
situation/choices → pose 1 (normal)
```

## What to copy out

When reusing this kit:

1. Copy `vn.css` and the two webfont links from `index.html` `<head>`.
2. Copy `components.jsx` and instantiate `<BgStack src=…>` then layer your
   screen on top.
3. The class API on `.vn-root` is **`vn-root--{title|quiz|final|loading}`**
   plus **`data-phase`** and **`data-score`** attributes that the CSS keys
   off of for the per-phase layout shift and per-score gradient.

## Known kit-level caveats

- The kit uses 3 questions per run instead of 5 to keep the demo brisk.
- The favicon shown at the top of the title screen is the scaffold purple
  bolt — flagged for replacement.
- Background grain animates `8s steps(10)`. If recording video, freeze it.
