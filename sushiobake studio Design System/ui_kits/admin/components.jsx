/* global React */
// Admin UI kit — sidebar, chapter/question lists, question editor, options grid

const { useState, useCallback } = React;
const SCORE_OPTIONS = [100, 80, 60, 20];

// ---------- HEADER ----------
function AdminHeader({ status, previewActive, onPreview, onExport, onImport, onReset, onClearPreview }) {
  return (
    <header className="admin-header">
      <div>
        <h1 className="admin-title">弱者男性を救え — 管理画面</h1>
        <p className="admin-subtitle">
          シチュエーション・選択肢を編集 → プレビュー → JSON を public/content.json に配置
        </p>
      </div>
      <nav className="admin-header-actions">
        <a className="admin-btn admin-btn--ghost" href="#game">ゲームへ</a>
        <button type="button" className="admin-btn admin-btn--primary" onClick={onPreview}>ゲームでプレビュー</button>
        <button type="button" className="admin-btn" onClick={onExport}>JSON エクスポート</button>
        <button type="button" className="admin-btn" onClick={onImport}>JSON インポート</button>
        <button type="button" className="admin-btn" onClick={onReset}>デフォルトに戻す</button>
        <button type="button" className="admin-btn admin-btn--muted" onClick={onClearPreview}>プレビュー解除</button>
      </nav>
      {status ? <p className="admin-status">{status}</p> : null}
      {previewActive ? (
        <p className="admin-badge">プレビューデータが有効です（ゲームは localStorage を優先）</p>
      ) : null}
    </header>
  );
}

// ---------- SIDEBAR ----------
function AdminSidebar({ levels, levelIndex, questionIndex, onPickLevel, onPickQuestion, onAddLevel, onAddQuestion }) {
  const level = levels[levelIndex];
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-section">
        <div className="admin-sidebar-head">
          <h2>章</h2>
          <button type="button" className="admin-btn admin-btn--small" onClick={onAddLevel}>＋</button>
        </div>
        <ul className="admin-list">
          {levels.map((lv, i) => (
            <li key={lv.id}>
              <button
                type="button"
                className={`admin-list-btn ${i === levelIndex ? "admin-list-btn--active" : ""}`}
                onClick={() => onPickLevel(i)}
              >{lv.title}</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="admin-sidebar-section">
        <div className="admin-sidebar-head">
          <h2>問題（{level?.questions.length ?? 0}）</h2>
          <button type="button" className="admin-btn admin-btn--small" onClick={onAddQuestion}>＋</button>
        </div>
        <ul className="admin-list">
          {level?.questions.map((q, i) => (
            <li key={i}>
              <button
                type="button"
                className={`admin-list-btn ${i === questionIndex ? "admin-list-btn--active" : ""}`}
                onClick={() => onPickQuestion(i)}
              >Q{i + 1}: {q.situation.slice(0, 28) || "（未入力）"}{q.situation.length > 28 ? "…" : ""}</button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// ---------- LEVEL CARD ----------
function LevelCard({ level, onChange }) {
  return (
    <section className="admin-card">
      <h2>章の設定</h2>
      <div className="admin-grid">
        <label className="admin-field">
          <span>ID</span>
          <input value={level.id} onChange={(e) => onChange({ id: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>タイトル</span>
          <input value={level.title} onChange={(e) => onChange({ title: e.target.value })} />
        </label>
        <label className="admin-field admin-field--full">
          <span>タグライン</span>
          <input value={level.tagline} onChange={(e) => onChange({ tagline: e.target.value })} />
        </label>
        <label className="admin-field">
          <span>アクセント色</span>
          <input type="color" value={level.accent} onChange={(e) => onChange({ accent: e.target.value })} />
        </label>
      </div>
    </section>
  );
}

// ---------- QUESTION CARD ----------
function QuestionCard({ question, qIndex, total, onChange, onRemove, canRemove }) {
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>問題 {qIndex + 1} / {total}</h2>
        <button
          type="button"
          className="admin-btn admin-btn--danger admin-btn--small"
          onClick={onRemove}
          disabled={!canRemove}
        >この問題を削除</button>
      </div>
      <label className="admin-field admin-field--full">
        <span>シチュエーション（ナレーション）</span>
        <textarea rows={4} value={question.situation} onChange={(e) => onChange({ situation: e.target.value })} />
      </label>
    </section>
  );
}

// ---------- OPTIONS CARD ----------
function OptionsCard({ question, onChangeOption }) {
  return (
    <section className="admin-card">
      <h2>選択肢（4つ）</h2>
      <div className="admin-options">
        {question.options.map((opt, i) => (
          <div key={i} className="admin-option-block">
            <h3>選択肢 {i + 1}</h3>
            <label className="admin-field admin-field--full">
              <span>台詞（彼に言わせる）</span>
              <textarea rows={2} value={opt.text} onChange={(e) => onChangeOption(i, { text: e.target.value })} />
            </label>
            <label className="admin-field">
              <span>点数</span>
              <select
                value={opt.score}
                onChange={(e) => onChangeOption(i, { score: Number(e.target.value) })}
              >
                {SCORE_OPTIONS.map((s) => <option key={s} value={s}>{s} 点</option>)}
              </select>
            </label>
            <label className="admin-field admin-field--full">
              <span>彼女の反応（セリフ）</span>
              <textarea rows={2} value={opt.reaction} onChange={(e) => onChangeOption(i, { reaction: e.target.value })} />
            </label>
            <label className="admin-field admin-field--full">
              <span>講評（点数表示後）</span>
              <textarea rows={2} value={opt.afterScoreLine} onChange={(e) => onChangeOption(i, { afterScoreLine: e.target.value })} />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, { AdminHeader, AdminSidebar, LevelCard, QuestionCard, OptionsCard, SCORE_OPTIONS });
