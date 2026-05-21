/* global React */
// Shared atoms for the game UI kit — Background stack, HUD, ADV window, sprite

const { useState, useEffect, useCallback } = React;

// ---------- BG STACK ----------
function BgStack({ src }) {
  return (
    <div className="vn-bg" aria-hidden="true">
      <img className="vn-bg-img" src={src} alt="" width="1920" height="1080" decoding="async" />
      <div className="vn-bg-bloom"></div>
      <div className="vn-bg-vignette"></div>
      <div className="vn-bg-scanlines"></div>
      <div className="vn-bg-grain"></div>
    </div>
  );
}

// ---------- HUD: TOP-RIGHT SCENE PILL ----------
function HudPill({ scene, total, chapter }) {
  return (
    <div className="vn-hud vn-hud--tr" aria-label="システム">
      <div className="vn-hud-pill">
        <span className="vn-hud-pill__scene">SCENE {scene}/{total}</span>
        <span className="vn-hud-pill__chapter">{chapter}</span>
      </div>
    </div>
  );
}

// ---------- HUD: BOTTOM-RIGHT HINTS ----------
function HudHints({ advancing, label, onTitle }) {
  return (
    <div className="vn-hud vn-hud--br" aria-label="操作">
      {advancing ? (
        <span className="vn-hud-hint">
          <span className="vn-hud-hint__key">▼</span>
          {label}
        </span>
      ) : null}
      <button type="button" className="vn-hud-hint vn-hud-hint--btn" onClick={onTitle}>TITLE</button>
    </div>
  );
}

// ---------- CHARA SPRITE (2x2 expression sheet) ----------
const CHARA_SHEET_SRC = "../../assets/characters/chara3_touka.png";
const HEROINE_NAME    = "由良 さくら";

function CharaSprite({ pose }) {
  return (
    <div className="vn-sprite-layer">
      <div className="vn-sprite-shadow" aria-hidden="true"></div>
      <div className="vn-sprite-glow">
        <div className="vn-sprite-frame">
          <img
            className={`vn-sprite-sheet vn-sprite-sheet--${pose}`}
            src={CHARA_SHEET_SRC}
            alt={`${HEROINE_NAME}（表情差分 ${pose}）`}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

// ---------- ADV WINDOW (character dialog) ----------
function AdvWindow({ speaker, body, variant, clickable, onActivate, score }) {
  const onKey = (e) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(); }
  };
  return (
    <div className="vn-adv-anchor">
      <div
        className={`vn-adv-window vn-adv-window--${variant} ${clickable ? "vn-adv-window--clickable" : ""}`}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? onActivate : undefined}
        onKeyDown={clickable ? onKey : undefined}
      >
        {speaker ? (
          <div className="vn-name-tag">
            <span className="vn-name-tag__inner">{speaker}</span>
          </div>
        ) : null}
        <div className="vn-adv-window__body">
          {score != null ? (
            <div className="vn-score-inline">
              <p className="vn-score-inline__num">{score}</p>
              <p className="vn-score-inline__unit">点</p>
            </div>
          ) : null}
          <p className="vn-dialog-text">{body}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- CHOICE OVERLAY ----------
function ChoiceOverlay({ options, onPick }) {
  return (
    <div className="vn-choice-overlay" role="dialog" aria-label="選択肢">
      <p className="vn-choice-overlay__caption">COMMAND SELECT</p>
      <ul className="vn-choice-list">
        {options.map((opt, i) => (
          <li key={i}>
            <button type="button" className="vn-choice-row" onClick={() => onPick(opt)}>
              <span className="vn-choice-row__idx">{i + 1}</span>
              <span className="vn-choice-row__txt">{opt.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, {
  BgStack, HudPill, HudHints, CharaSprite, AdvWindow, ChoiceOverlay,
  HEROINE_NAME, CHARA_SHEET_SRC,
});
