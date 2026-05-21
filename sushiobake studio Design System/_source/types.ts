/** 1問あたりの選択肢に付く点数（問題ごとにデータで変えられる） */
export type ScoreValue = 100 | 80 | 60 | 20

export type QuizOption = {
  text: string
  score: ScoreValue
  /** キャラのセリフ（選択直後） */
  reaction: string
  /** 点数表示のあとに出す一言（ざっくりでOK） */
  afterScoreLine: string
}

export type QuizQuestion = {
  /** シチュ説明 */
  situation: string
  options: [QuizOption, QuizOption, QuizOption, QuizOption]
}

export type LevelPack = {
  id: string
  title: string
  tagline: string
  accent: string
  questions: QuizQuestion[]
}
