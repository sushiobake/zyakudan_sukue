/* global React */

const SCORE_RANKS = [
  { min: 0,   title: "見守るしかない神",   comment: "彼はまだ、自分の言葉に溺れている。" },
  { min: 201, title: "人類補完計画見習い", comment: "少しずつ、現場の空気が読めるようになってきた。" },
  { min: 301, title: "救世主見習い",       comment: "彼女の表情が、少し柔らかくなった。" },
  { min: 401, title: "現場の神",           comment: "弱者男性を、穏やかに救えた。" },
  { min: 481, title: "全知の恋愛神",       comment: "完璧に近い。あとは本人に任せよう。" },
];

function getScoreRank(total, max) {
  const pct = max > 0 ? total / max : 0;
  if (pct >= 481 / 500) return SCORE_RANKS[4];
  if (pct >= 401 / 500) return SCORE_RANKS[3];
  if (pct >= 301 / 500) return SCORE_RANKS[2];
  if (pct >= 201 / 500) return SCORE_RANKS[1];
  return SCORE_RANKS[0];
}

function EndingCard({ level, total, max, onRestart }) {
  const rank = getScoreRank(total, max);
  const shareText = `弱者男性を救え！（神視点）\n${level.title}\n${rank.title}：${total} / ${max} 点`;
  const shareUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: shareText, url: "" })}`;
  return (
    <div className="vn-ending-screen">
      <div className="vn-ending-card">
        <p className="vn-ending-ribbon">ENDING</p>
        <p className="vn-ending-rank">{rank.title}</p>
        <h2 className="vn-ending-score">
          {total}
          <span className="vn-ending-score__slash">/</span>
          {max}
          <span className="vn-ending-score__suffix"> score</span>
        </h2>
        <p className="vn-ending-copy">{level.title} — {rank.comment}</p>
        <div className="vn-ending-actions">
          <a className="vn-ending-primary" href={shareUrl} target="_blank" rel="noreferrer">X で結果をポスト</a>
          <button type="button" className="vn-ending-secondary" onClick={onRestart}>タイトルへ戻る</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EndingCard, getScoreRank, SCORE_RANKS });
