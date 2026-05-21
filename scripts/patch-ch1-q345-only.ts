/**
 * public/content.json の第1章 Q3〜Q5 だけを、指定文案で部分上書き。
 * Q1・Q2・章情報・第2章以降は一切触らない。questions.ts は使わない。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import type { LevelPack, QuizQuestion } from '../src/types'

const Q3: QuizQuestion = {
  situation:
    '店に入り、注文を済ませた。\n料理が来るまで、少し時間がある。彼女はおしぼりを丁寧に開いて、手を拭いている。\n会話が一度途切れた。彼の胸の中だけが、急に騒がしくなる。',
  commonReview:
    '数秒の沈黙は、誰でも少し気になる。沈黙そのものが悪いわけではないが、男が「埋めなければ」と[gold]焦った瞬間[/gold]、ほぼ確実に外す。\n\n100点は、焦らずに[gold]軽い球を一つ投げる[/gold]。「ここ、よく来るの？」程度で十分。短く、相手が乗りやすい話題を渡す——それだけ。\n\n弱者男性は、焦って自分の話を長く始めるか、雑学で講師の位置を取るか、自虐で慰めを徴収する。形は違うが、どれも[warn]「俺の不安を処理してくれ」[/warn]が透ける。\n\n沈黙は壊すものでも、無理に許容するものでもない。軽くかわすもの。',
  options: [
    {
      text: '「ここ、よく来るの？」と軽く話題を投げる',
      score: 100,
      reaction: '……たまにかな。雰囲気が落ち着いてて。（自然に答え始める）',
      evaluation:
        '## 正解\n短く、相手が乗りやすい球を投げた。沈黙を「場面」にしないのが、もっとも軽い処理。',
    },
    {
      text: '「俺さ、最近の仕事でね——」と、自分の話で間を埋める',
      score: 80,
      reaction: '……うん、それで？（聞いてはいる）',
      evaluation:
        '## 自伝で埋める\n埋めようとして自分の話を始めた瞬間、彼女は聞き手の席に固定される。沈黙より、長い自伝のほうがずっと重い。',
    },
    {
      text: '「この店、雑誌で見たんだ。豆の産地が——」と雑学で間を埋める',
      score: 60,
      reaction: '……へえ、そうなんだ。（笑顔は出るが、目は別の方向）',
      evaluation:
        '## 知識マウント\n役に立ちたい・価値を見せたいが裏返って、講師ポジションを取った。情報の正しさと魅力は別物。',
    },
    {
      text: '「俺といて、つまんなくない？」と笑いながら自虐で確認する',
      score: 20,
      reaction: '……えっ、そんなことないよ？（少しだけ笑うが、目は泳ぐ）',
      evaluation:
        '## 慰めの徴収\n自分の不安を、相手に「大丈夫だよ」と言わせて処理した。一度ケア要員の席に上げられた彼女は、もう降りない。',
    },
  ],
}

/** Q4: シチュの枠は維持し、彼女の台詞だけ案Aに差し替え */
function patchQ4SituationOnly(q: QuizQuestion): QuizQuestion {
  const lineA =
    '彼女がふと、「私、前付き合ってた人とは結構しんどくて……あ、ごめん、関係ない話だね」と笑って自分でかぶせた。'
  const patterns = [
    /彼女がふと、「[^」]+」と笑って自分でかぶせた。/,
    /彼女がふと、「[^」]+」と笑って、自分でかぶせた。/,
  ]
  let situation = q.situation
  let replaced = false
  for (const re of patterns) {
    if (re.test(situation)) {
      situation = situation.replace(re, lineA)
      replaced = true
      break
    }
  }
  if (!replaced) {
    situation =
      '料理が運ばれてきた頃。\n' +
      lineA +
      '\n取り消したその言葉が、テーブルの空気にだけ少し残る。'
  }
  return { ...q, situation }
}

const Q5: QuizQuestion = {
  situation:
    '食事を終え、伝票が置かれた。\n彼女がさりげなく財布に手を伸ばす。動作はゆっくりで、止められればすぐ止まる速度。\n今日の締め方を、ここで決める。',
  commonReview:
    '会計は「いくら払うか」より、[gold]いかに重さを作らないか[/gold]が問われる。100点は迷わず一手で決め、説明をしない。「ありがとう」を一回もらえば、それで終わり。\n\n弱者男性は、会計を盛大な見せ場にしようとする。「お礼に」のフレームを足す、「フェアだから」と割り勘を提案する、「次は奢って」と恩を貸し付ける——選び方は違っても、結果は同じ。[warn]彼女に何度もお礼を言わせるか、温度を下げるか、貸し借りの帳簿を開く[/warn]。\n\n「次は私が」と返ってきたら、拒まず「じゃあ、また」と軽く受ける。これだけが拾える男に、次の機会が来る。',
  options: [
    {
      text: 'さらりと伝票を取り、「今日は出させて」とだけ言う。「ありがとう」には「また会おう」と軽く返す',
      score: 100,
      reaction: '……ありがとう。私も、すごく楽しかった。',
      evaluation:
        '## 正解\n一手で完結。理由も恩も付けない。会計を「場面」にしなかった男にだけ、軽い別れと次の約束が残る。',
    },
    {
      text: '「今日のお礼に、出させて。付き合ってくれてありがとう」と、お礼のフレームで奢る',
      score: 80,
      reaction: '……えっ、いや、私もお礼を言いたいくらいなのに。（少し笑うが、語尾が止まる）',
      evaluation:
        '## お礼フレーム\n「お礼に」を足した瞬間、彼女を「お礼を言われる側」に固定した。彼女の今日の時間が、男に貸しを作ったことになる。誠意のつもりが、目に見えない重さを残す。',
    },
    {
      text: '「今日は割り勘でいい？　最近そのほうが、お互い気が楽でしょ」と先に切り出す',
      score: 60,
      reaction: '……うん、そうだね。（軽く笑うが、財布を出す手が機械的になる）',
      evaluation:
        '## フェアの逃げ\n「フェア」「気が楽」のフレームで、責任を引き受けるのが怖いことを隠した。これは弱者男性が[mute]自信を持って選んでしまう[/mute]もっとも典型的な敗け筋。一見スマートだが、彼女側で「この男には期待しない」のラベルが静かに貼られる。',
    },
    {
      text: '「俺、今日のために頑張ったから。次は奢ってくれてもいいよ？」と冗談めかして匂わせる',
      score: 20,
      reaction: '……あ、うん。（笑顔が固まる）',
      evaluation:
        '## 恩の貸し付け\n奢った直後に「次は」を出した瞬間、奢りが借金になる。彼女は二度と気持ちよく次の約束ができなくなる。',
    },
  ],
}

for (const file of ['public/content.json', 'content.json'] as const) {
  const content = JSON.parse(readFileSync(file, 'utf8')) as LevelPack[]
  const lv1 = content.find((l) => l.id === 'lv1')
  if (!lv1 || lv1.questions.length < 5) throw new Error(`${file}: lv1 invalid`)

  const nc3 = lv1.questions[2]?.needsCheck
  const nc4 = lv1.questions[3]?.needsCheck
  const nc5 = lv1.questions[4]?.needsCheck

  lv1.questions[2] = { ...Q3, ...(nc3 !== undefined ? { needsCheck: nc3 } : {}) }
  lv1.questions[3] = patchQ4SituationOnly(lv1.questions[3])
  if (nc4 !== undefined) lv1.questions[3].needsCheck = nc4
  lv1.questions[4] = { ...Q5, ...(nc5 !== undefined ? { needsCheck: nc5 } : {}) }

  writeFileSync(file, JSON.stringify(content, null, 2), 'utf8')
  console.log(`OK ${file}: Q3+Q5 full patch, Q4 situation dialogue only (案A)`)
}
