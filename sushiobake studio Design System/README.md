# sushiobake studio — Design System

**sushiobake studio** is a small Japanese indie studio building **mature-leaning,
realistic romance simulation games** for the web. The signature title in this
design system is **「弱者男性を救え！リアル恋愛シミュレーション」** ("Save the
Weak Men! — A Realistic Romance Sim"), a short-form Japanese-language ADV /
gal-game-format quiz where the player takes a *god's-eye* role, choosing what
a struggling man says next and watching the heroine react, scene by scene.

The aesthetic brief from the studio is explicit:

> 大人向けのリアル寄り恋愛シミュレーションゲームの視覚スタイル。落ち着いた配色、
> 洗練されたタイポグラフィ、ギャルゲのフォーマットを保ちつつ大人びた雰囲気。
> アニメ的・エロゲ的なケバさは避ける。

In English: **adult-leaning, realistic dating-sim look. Calm palette, refined
typography, gal-game format kept — but the anime / eroge garishness stripped
out.** Photographic-real heroine sprites (not anime drawings), warm cream UI,
brown ink, one smoky-rose accent.

---

## Sources

This system was reverse-built from a single codebase provided by the studio:

| Source | Type | Path |
| --- | --- | --- |
| `zyakudan_sukue` | React 19 + Vite + TypeScript app, the production game | mounted folder `zyakudan_sukue/` |

The game is structured as a Vite SPA with a hash-routed admin panel (`#/admin`)
for editing scenarios, options and scoring. Two main surfaces:

1. **Game** (`/src/game/GameApp.tsx`) — full-bleed visual-novel runtime with
   four phases per question: `situation → choices → reaction → score`, plus
   `title` and `final` screens.
2. **Admin** (`/src/admin/AdminApp.tsx`) — cream-paper, sidebar+main layout
   for editing chapters, questions, options, scores, and exporting JSON.

Other useful files lifted from the codebase (kept under `_source/` for
reference, not for distribution):

- `_source/App.css` — the full visual-novel style sheet (definitive token + layout source of truth)
- `_source/index.css` — the root CSS variables (palette + font stacks)
- `_source/Admin.css` — admin layout
- `_source/GameApp.tsx`, `_source/AdminApp.tsx` — component recreations should mirror these
- `_source/ranks.ts`, `_source/sprite.ts`, `_source/types.ts` — content schema, sprite-sheet layout (2×2 expression sheet), rank thresholds

---

## Index

Root files

- **`README.md`** — *you are here*
- **`SKILL.md`** — Agent-Skill front-matter so this folder works as a portable Claude skill
- **`colors_and_type.css`** — single source of truth for tokens (palette + type) and semantic CSS
- **`_source/`** — copies of the original game source for grounding

Visual assets

- **`assets/logos/`** — `favicon.svg` (purple lightning-bolt mark from the original Vite scaffold — see Iconography), `og-image.png` (cover art)
- **`assets/backgrounds/`** — `haikei1–4.png` (the four full-bleed scene backgrounds — sunset waterfront, etc.), `haikei_moto.png` (raw plate), `bg-classroom.svg` (SVG fallback)
- **`assets/characters/`** — `chara3_touka.png` (2×2 expression sheet of the heroine **由良 さくら / Yura Sakura**), `chara1.png`, `chara1_touka.png`, `character-placeholder.svg`
- **`assets/icons/icons.svg`** — SVG sprite of social + utility icons (Bluesky, Discord, GitHub, X, social, documentation)
- **`assets/content.json`** — the live narrative content (3 chapters × 5 questions × 4 options)

Cards (auto-rendered into the Design System tab)

- **`preview/`** — small HTML preview cards for each design-system concept

UI kits (high-fidelity recreations of real product screens)

- **`ui_kits/game/`** — visual-novel runtime: title → situation → choices → reaction → score → ending (click-thru prototype)
  - `index.html`, `vn.css` (production CSS), `kit.css`, `data.js`,
    `components.jsx` (BgStack/HudPill/HudHints/CharaSprite/AdvWindow/ChoiceOverlay),
    `TitleScreen.jsx`, `QuizScreen.jsx`, `EndingCard.jsx`
- **`ui_kits/admin/`** — content-editor admin app: chapter list, question editor, options grid (with live state)
  - `index.html`, `admin.css` (production CSS), `kit.css`,
    `components.jsx` (AdminHeader/AdminSidebar/LevelCard/QuestionCard/OptionsCard)

---

## CONTENT FUNDAMENTALS

**Language.** All copy is **Japanese**. The studio is JP-domestic.
English appears only as **typographic furniture** — short caps labels like
`SCENE 3/5`, `COMMAND SELECT`, `ENDING`, `NEXT`, `RESULT`, `TITLE`,
`CLICK` — set in monospace with wide tracking. Never use English as
sentence-level body copy.

**Politeness register.** The narration leans **literary, observational,
slightly cool** — Mincho serif, present tense, no exclamation, no emoji.
Examples:

- 「目の前の彼を、現場の空気ごとひっくり返す。」
- 「彼女の表情が、少し柔らかくなった。」

The player is addressed as **「神」(kami / god-view)** — a knowing, ironic
narrator. Buttons / menu items are short imperative phrases:
**「タイトルへ戻る」「ゲームでプレビュー」「JSON エクスポート」**.

**Tone.** Quiet sincerity with a dry, slightly self-aware streak. The
title literally jokes ("Save the *weak men*") and the studio openly
calls out *「特定の個人・集団を揶揄する意図はありません」* (no intent to
mock any individual or group) — so the **subject matter is risky but the
voice is steady, almost therapeutic**. Critiques of player choices read
like a calm older friend, not a punishment screen:

- 100点: 「相手の負担を減らせている。」
- 80点 : 「悪くはないが、相手によっては警戒される。」
- 60点 : 「安全だが、会話のフックが弱い。」
- 20点 : 「初手で重い。相手は『返す労力』を感じてしまう。」

**Person.** Narration is third-person, but instructional copy slips into
plain あなた / 自分 framing. Heroine reactions are inline-quoted with
brackets — 「……読みやすい。続きが気になる。」 — or with parenthetical
beats — 「（既読がつかない）」 — for non-verbal moments. Never use
exclamation marks for the heroine.

**Casing & punctuation.** Japanese uses **fullwidth punctuation**
(、。「」（）) consistently. English ALL-CAPS labels are tracked
~0.28em. Em-dashes appear as ` — `. Ellipses are **「……」** (double
horizontal-three-dot), not "...".

**Vibe summary.** Adult, calm, literate. A late-evening café tone, not a
neon-lit arcade. Romance with self-knowledge.

---

## VISUAL FOUNDATIONS

**Palette.** A tight three-temperature system:

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Ink (text) | `--ink` | `#3d342c` | All body text. Warm brown — *never* `#000`. |
| Page | `--page` | `#efe8df` | Body background. Off-cream, faintly pink-grey. |
| Panel | `--panel` | `#fffdf9` | Cards, menu buttons. Warm cream. |
| Panel 2 | `--panel-2` | `#fdf6ee` | Inner panels, admin sidebar. |
| Brown frame | `--brown-frame` | `#a68462` | Hairline borders on title-screen menu. |
| Brown deep | `--brown-deep` | `#6f563f` | Sub-headings, secondary text. |
| **Rose** | `--rose` | `#e8789a` | **The single accent.** Hover edge, eyebrows, score text gradient. |
| Rose soft | `--rose-soft` | `#f4c4d4` | Default left-border on menu buttons. |
| Champagne | `--champagne` | `#f3e3cc` | Warm wash highlights. |
| ADV body | `--adv-body` | `rgba(36,28,52,0.92)` | Dialog window — near-black with a purple cast. |
| ADV name tag | `--adv-name` | `rgba(72,48,96,0.92)` | Character-name tab above dialog. |

Score numerals get **per-score vertical gradients** rather than flat
colors (gold→rose for 100, rose for 80, orange for 60, steel-grey for
20). This is the only place gradients on text are used.

**Typography.**

- Display — **Shippori Mincho B1** 600/800 (headings, score numbers, menu
  button titles, ending rank). High contrast vertical mincho.
- Serif — **Noto Serif JP** 500/600/700 (long-form body, subtitle copy).
- UI — **Zen Kaku Gothic New** 500/700/900 (buttons, dialog body, hud).
- Mono — system `ui-monospace` for caps labels (`SCENE 1/5`).

Pairing is **Mincho display + JP gothic body**, classic gal-game move,
but with much heavier weight contrast than usual to read as adult /
editorial. Line-height runs **generous (1.55–1.95)** even on body
buttons.

**Spacing & radius.** Two radii in production: **`2px` (sharp)** for the
dialog window and choice rows — VN/eroge convention — and **`4–8px`
(soft)** for everything else (cards, menu buttons, ending card,
admin cards). Never `12+`. The system is **mostly square**, occasionally
warmed with 8px on hero cards.

**Backgrounds.** Always full-bleed, with a four-layer stack:

1. `vn-bg-img` — the photographic anime-style landscape (sunset
   waterfront, classroom, café, balcony). `object-fit: cover`,
   `object-position: center 38%`, scaled 1.02× and saturated +5%.
2. `vn-bg-bloom` — radial sun bloom from upper-right at `soft-light`.
3. `vn-bg-vignette` — inset `box-shadow` warm at edges, deeper at the
   bottom (where the ADV window lives).
4. `vn-bg-scanlines` + `vn-bg-grain` — extremely subtle (`opacity:
   0.018` and `0.035`), the grain animates `vn-grain-shift` 8s steps(10)
   for life. Disabled on the quiz screen for legibility.

Imagery is warm — **sunset oranges, dusty roses, soft purples**. The
brand never uses cool blues as a primary mood. Hand-drawn / SVG
backgrounds exist only as a fallback (`bg-classroom.svg`).

**Animation.** Conservative.

- Transitions on hover/press are **`0.14–0.18s ease`** for buttons.
- Sprite-frame and layout shifts are **`0.35–0.38s
  cubic-bezier(0.33, 1, 0.68, 1)`** — quick-out / slow-in.
- Background grain animates 8s steps(10) infinite for breathing.
- No bounces, no springs, no easing flourish. Adult ≠ playful.

**Hover / press states.**

- Menu buttons: `transform: translateX(6px)` + the left-border color
  switches from `--rose-soft` to `--rose`, and a rose-tinted shadow
  appears.
- Choice rows: left-border becomes `--rose`, background steps from
  `rgba(255,255,255,0.06)` to `0.12`, `translateX(3px)`.
- Admin pill buttons: border color swaps from brown to rose.
- Press states are not specially designed — there are no `:active`
  shrink effects. Adult convention: hover is enough.

**Borders & hairlines.** Borders are *warm*, never grey. Default:
`1px solid #e7dfd6` (`--panel-edge`). Higher-emphasis: `1px solid
rgba(166,132,98,0.38)` (`--hairline-warm`). On dark dialog windows,
`rgba(255,255,255,0.1)`.

**Shadows / elevation.**

- **Card** — `0 8px 24px rgba(90,72,58,0.06)`. Warm brown shadow, very
  diffuse, low alpha.
- **Pop / focus** — `0 14px 34px rgba(90,72,58,0.12)`.
- **Rose hover** — `0 14px 34px rgba(232,120,154,0.28)` for the title-
  screen menu hover and primary CTA.
- **Dialog window** — `0 8px 28px rgba(0,0,0,0.28)` over images.
- **Inset highlight** — many cream surfaces carry `inset 0 0 0 1px
  rgba(255,255,255,0.65)` for a paper-edge glow.

**Transparency & blur.** Used deliberately on overlays only:
- Title-menu buttons have `backdrop-filter: blur(12px)` and ~85% paper
  alpha — sitting *over* the photo.
- Ending card uses `backdrop-filter: blur(14px)`.
- Admin sticky header uses `blur(10px)` over `0.96` paper.
- The ADV (dialog) window uses **no blur** — it relies on the
  `0.92→transparent` gradient instead, which is the genre-correct VN
  treatment.
- HUD pills (`SCENE 1/5`) are smoked `rgba(28,24,36,0.72)`.

**Layout rules.**

- The **canvas is 1920×1080 base** (the BG image is sized for it). At
  runtime everything is `vw/vh/dvh`-relative, the quiz screen is
  *non-scrolling* and capped at `100dvh`.
- Sprite is centered (`left: 50%`) during situation/reaction/score and
  shifted to `left: 70%` during choices to make room for the
  choice-overlay on the left.
- Dialog is *bottom-left*, choice overlay is *above the dialog* — never
  centered. This is the VN convention and the design respects it.

**Corner radii at a glance.**

| Element | Radius |
| --- | --- |
| Dialog window | `0 4px 4px 4px` (mitered top-left under name tag) |
| Choice rows | `2px` |
| Menu buttons | `0` outside, `4px` accent left-border |
| Cards / ending | `8px` |
| Score ribbon | `3px` |
| HUD pills | `999px` (full pill) |

**Card anatomy** — title-menu button:

```
┌─────────────────────────────────────────────┐  ◄ left border 4px, rose-soft
│  01   第1章：まずは呼吸を整えよう               │  ◄ mono key + display title
│       清潔感・距離感の入門。彼を、穏やかに救う。 │  ◄ serif subtitle, muted
└─────────────────────────────────────────────┘
  paper gradient · hairline-warm · soft brown shadow
  hover: shifts 6px right, left border → rose, shadow → rose
```

---

## ICONOGRAPHY

The codebase does **not** ship a custom icon set — the production game
uses *typographic icons* (▼, ＋, ％, ／) and emoji-free, kanji-driven
labels. The few real icons present are:

- **`assets/icons/icons.svg`** — an SVG `<symbol>` sprite of brand /
  social glyphs in two styles:
  - **Solid** at fill `#08060d` — Bluesky, Discord, GitHub, X (Twitter)
  - **Outline** at stroke `#aa3bff` (purple), 1.35 stroke, round caps
    — `documentation-icon`, `social-icon`
  Note: the purple `#aa3bff` is a remnant of the Vite scaffold's brand
  palette and is **not** part of the studio's actual romance palette.
  Treat these social icons as utility-only — never colorize them rose;
  invert to white over the dark dialog window if needed.
- **`assets/logos/favicon.svg`** — purple lightning-bolt mark, also a
  scaffold remnant. **Flagged for the studio to replace** with a
  proper sushiobake mark.

**Iconography rules going forward.**

1. **Prefer typography over icons.** Use the mono caps eyebrow
   (`SCENE 3/5`, `COMMAND SELECT`, `NEXT ▼`) instead of an icon
   wherever possible. This is the genre vernacular.
2. **Allowed unicode glyphs.** `▼` (advance), `▲` (collapse), `＋ ／
   ％ ＞` for utility. Always **fullwidth where reading JP**.
3. **No emoji.** They break the calm adult register.
4. **If a real icon is needed**, use **Lucide** (`lucide.dev`) at
   **stroke 1.5**, 18–22px, in `--ink` or `--brown-deep`. Lucide's
   tight geometric line matches the design's restrained line-weight.
   Loaded from CDN:
   ```html
   <script src="https://unpkg.com/lucide@latest"></script>
   ```
   This is a **substitution** — flagged for the studio to confirm /
   replace with a bespoke set if desired.
5. **The character sprite *is* the iconography.** Heroine expression
   states (1 normal, 2 smile, 3 shy, 4 surprise) carry as much
   semantic weight as any icon set would; design around them.

---

## FONTS

All four typefaces are pulled from **Google Fonts** via the import in
`colors_and_type.css`:

```
Noto Serif JP        500 600 700
Shippori Mincho B1   600 800
Zen Kaku Gothic New  500 700 900
```

No webfont files are bundled — these are free, well-supported on JP web
and match exactly what the production game ships. **No font
substitution was required.** ✔︎

---

## CAVEATS

- The studio's bespoke brand mark / wordmark is not present in the
  codebase. Both `favicon.svg` and `og-image.png` appear to be Vite
  scaffold or AI-generated placeholders. **Replace before launch.**
- The social-icon sprite carries a purple `#aa3bff` accent that is
  *not* part of the studio palette — treated as utility-only above.
- The game uses **photographic** character sprites (`chara*.png`) which
  is a deliberate brand differentiator from anime gal-games. Any new
  character art must follow this realistic / fashion-photography
  direction, not illustration.
- Only one heroine (**由良 さくら / Yura Sakura**) is currently
  represented. Additional character sprites would need to follow the
  same 2×2 expression-sheet layout (`CHARA_SHEET_SIZE = 1254×1254`,
  poses `1=normal, 2=smile, 3=shy, 4=surprised`).
