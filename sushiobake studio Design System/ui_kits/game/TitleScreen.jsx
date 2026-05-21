/* global React */

const STUDIO_MARK_SRC = "../../assets/logos/mark.svg";

function TitleScreen({ levels, onStart }) {
  return (
    <div className="tps-screen">
      <header className="tps-top">
        <a className="tps-studio" href="#" aria-label="sushiobake studio">
          <img className="tps-studio__mark" src={STUDIO_MARK_SRC} alt="" />
          <span className="tps-studio__name">
            <b>sushiobake</b>
            <span>STUDIO</span>
          </span>
        </a>
        <a className="tps-admin" href="#admin">管理 / ADMIN</a>
      </header>

      <section className="tps-center">
        <div className="tps-lockup">
          <p className="tps-eyebrow">恋愛 ADV · 02 · BROWSER</p>

          <h1 className="tps-title">
            <span className="tps-title__line">弱者男性を</span>
            <span className="tps-title__line tps-title__line--bang">
              <span className="tps-title__verb">救え</span>
              <span className="tps-title__bang">！</span>
            </span>
          </h1>

          <span className="tps-rule" aria-hidden="true"></span>

          <p className="tps-subtitle">“リアル”恋愛シミュレーション</p>

          <p className="tps-lead">
            あなたは神視点。目の前の彼を、現場の空気ごとひっくり返す。
            <br />
            選択 → 彼女の反応 → 採点、を3シーン繰り返す短編ADV。
          </p>
        </div>

        <ul className="tps-menu" aria-label="章の選択">
          {levels.map((pack, i) => (
            <li key={pack.id}>
              <button type="button" className="tps-menu-btn" onClick={() => onStart(pack)}>
                <span className="tps-menu-btn__k">{String(i + 1).padStart(2, "0")}</span>
                <span className="tps-menu-btn__t">
                  <b>{pack.title}</b>
                  <span>{pack.tagline}</span>
                </span>
                <span className="tps-menu-btn__arrow">→</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <footer className="tps-bottom">
        <p className="tps-bottom__meta">CLICK TO BEGIN · NO AUDIO · FICTION</p>
        特定の個人・集団を揶揄する意図はありません。恋愛コミュニケーション学習を目的としたフィクションです。
      </footer>
    </div>
  );
}

window.TitleScreen = TitleScreen;
