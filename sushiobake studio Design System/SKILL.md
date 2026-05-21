---
name: sushiobake-design
description: Use this skill to generate well-branded interfaces and assets for sushiobake studio (a mature-leaning realistic Japanese romance-sim studio, signature game 「弱者男性を救え！」), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy
assets out and create static HTML files for the user to view. If working on
production code, you can copy assets and read the rules here to become an
expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they
want to build or design, ask some questions, and act as an expert designer
who outputs HTML artifacts *or* production code, depending on the need.

Key references inside this skill:

- `colors_and_type.css` — drop-in token sheet (palette + JP webfonts + semantic elements). Import this first.
- `assets/` — backgrounds (`haikei*.png`), character sprite-sheets (`chara3_touka.png` is a 2×2 expression sheet), icon SVG sprite, logos. Reuse before drawing.
- `_source/App.css` — the production CSS — the definitive ground truth for VN runtime visuals (BG layers, ADV window gradient, choice rows, score numerals).
- `ui_kits/game/` — high-fidelity recreation of the visual-novel runtime. Components: `TitleScreen`, `QuizScreen`, `EndingCard`, `AdvWindow`, `ChoiceOverlay`, `HudPill`, `CharaSprite`.
- `ui_kits/admin/` — recreation of the content-editor admin app.

Brand cheat-sheet:

- **Voice:** Japanese. Calm, literate, dry. No emoji. No exclamation marks for the heroine. English only as caps mono furniture (`SCENE 1/5`, `NEXT ▼`).
- **Palette:** cream paper (`#fffdf9`) + brown ink (`#3d342c`) + smoky rose accent (`#e8789a`). ADV dialog window is dark aubergine (`rgba(36,28,52,0.92)`) with a left-to-right fade.
- **Type:** Shippori Mincho B1 (display) + Noto Serif JP (body) + Zen Kaku Gothic New (UI) + system mono.
- **Look:** full-bleed romantic landscape BG + soft grain + vignette → photo-real heroine sprite → bottom-left ADV window with character name tab → choice overlay above the dialog when in `choices` phase.
- **Avoid:** anime-style line art, eroge garishness, bluish-purple gradient blobs (the scaffold favicon is *not* representative), emoji, sharp greys, cool blue moods.
