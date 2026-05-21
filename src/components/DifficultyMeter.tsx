import { resolveDifficulty } from '../utils/difficulty'
import type { LevelPack } from '../types'

type Props = {
  level: Pick<LevelPack, 'id' | 'difficulty'>
  className?: string
}

/** 章選択の難易度表示（3段階・0.5刻み対応） */
export default function DifficultyMeter({ level, className = '' }: Props) {
  const value = resolveDifficulty(level)
  const filled = Math.floor(value)
  const half = value - filled >= 0.5

  return (
    <span
      className={`tps-diff ${className}`.trim()}
      aria-label={`Grade ${value} of 3`}
    >
      <span className="tps-diff__label">GRADE</span>
      <span className="tps-diff__dots" aria-hidden>
        {[0, 1, 2].map((i) => (
          <i
            key={i}
            className={
              i < filled ? 'on' : i === filled && half ? 'half' : undefined
            }
          />
        ))}
      </span>
    </span>
  )
}
