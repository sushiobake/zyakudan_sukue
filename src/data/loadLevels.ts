import type { LevelPack } from '../types'
import { createBackup } from './backups'
import { normalizeLevels } from './normalizeLevels'
import type { ScoreRank } from '../types'
import { publishGameData } from './publishContent'
import { DEFAULT_RANKS } from './ranks'
import { LEVELS as DEFAULT_LEVELS } from './questions'
import {
  LEVELS_PREVIEW_KEY,
  LEVELS_PRODUCTION_KEY,
  LEVELS_SLOT_1_KEY,
  LEVELS_SLOT_2_KEY,
} from './storage'

const SOURCE_MIGRATION_KEY = 'zyakudan-content-json-source-v1'

function parseLevels(raw: unknown): LevelPack[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  return normalizeLevels(raw as LevelPack[])
}

/** 古い localStorage 本番キャッシュを無効化（リロードで content.json を読むため） */
export function migrateContentSource(): void {
  try {
    if (localStorage.getItem(SOURCE_MIGRATION_KEY)) return
    localStorage.removeItem(LEVELS_PRODUCTION_KEY)
    localStorage.removeItem(LEVELS_SLOT_1_KEY)
    localStorage.removeItem(LEVELS_SLOT_2_KEY)
    localStorage.removeItem(LEVELS_PREVIEW_KEY)
    localStorage.removeItem('zyakudan-levels-preview-version')
    localStorage.removeItem('zyakudan-levels-active-source')
    localStorage.setItem(SOURCE_MIGRATION_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** @deprecated ゲームは content.json を読む。バックアップ復元用のみ */
export function loadProduction(): LevelPack[] | null {
  migrateContentSource()
  try {
    const raw = localStorage.getItem(LEVELS_PRODUCTION_KEY)
    if (!raw) return null
    return parseLevels(JSON.parse(raw))
  } catch {
    return null
  }
}

/** 保存：バックアップ作成 ＋ content.json へ書き込み（開発サーバー時） */
export async function saveEditorContent(
  levels: LevelPack[],
  ranks: ScoreRank[] = DEFAULT_RANKS,
): Promise<{
  backupLabel: string
  published: boolean
}> {
  const normalized = normalizeLevels(levels)
  const backupLabel = createBackup(normalized)
  const published = await publishGameData({ levels: normalized, ranks })
  return { backupLabel, published }
}

/** content.json → 同梱 */
export async function loadBundledLevels(): Promise<LevelPack[]> {
  migrateContentSource()
  try {
    const res = await fetch(`/content.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = parseLevels(await res.json())
      if (data?.length) return data
    }
  } catch {
    /* ignore */
  }
  return normalizeLevels(DEFAULT_LEVELS)
}

/** ゲーム・管理画面の共通データ源（常に content.json） */
export async function loadLevels(): Promise<LevelPack[]> {
  return loadBundledLevels()
}

/** @deprecated */
export function saveProduction(levels: LevelPack[]): string {
  const normalized = normalizeLevels(levels)
  return createBackup(normalized)
}
