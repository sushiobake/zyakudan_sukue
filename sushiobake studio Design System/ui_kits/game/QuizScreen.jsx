/* global React, HudPill, HudHints, CharaSprite, AdvWindow, ChoiceOverlay, HEROINE_NAME */

function resolveCharaPose(phase, picked) {
  if (phase === "situation" || phase === "choices") return 1;
  const s = picked?.score;
  if (s == null) return 1;
  if (s >= 80) return 2;
  if (s >= 60) return 3;
  return 4;
}

function QuizScreen({ level, qIndex, total, phase, picked, onAdvance, onPick, onTitle }) {
  const question = level.runQuestions[qIndex];
  const pose = resolveCharaPose(phase, picked);
  const advClickable = phase === "situation" || phase === "reaction" || phase === "score";

  let speaker = "", body = "", score = null;
  if (phase === "situation")  { speaker = "ナレーション";        body = question.situation; }
  else if (phase === "choices")  { speaker = "プレイヤー（神）";    body = "彼に言わせる台詞を選ぶ。"; }
  else if (phase === "reaction") { speaker = HEROINE_NAME;          body = picked ? `「${picked.reaction}」` : ""; }
  else if (phase === "score")    { speaker = "講評";                body = picked ? picked.afterScoreLine : ""; score = picked?.score; }

  const hintLabel = phase === "score"
    ? (qIndex + 1 < total ? "NEXT" : "RESULT")
    : "CLICK";

  return (
    <>
      <CharaSprite pose={pose} />

      <HudPill scene={qIndex + 1} total={total} chapter={level.title} />
      <HudHints advancing={advClickable} label={hintLabel} onTitle={onTitle} />

      <div className="vn-adv-stack">
        {phase === "choices" && (
          <ChoiceOverlay options={question.options} onPick={onPick} />
        )}
        <AdvWindow
          speaker={speaker}
          body={body}
          variant={phase}
          clickable={advClickable}
          onActivate={onAdvance}
          score={score}
        />
      </div>
    </>
  );
}

window.QuizScreen = QuizScreen;
window.resolveCharaPose = resolveCharaPose;
