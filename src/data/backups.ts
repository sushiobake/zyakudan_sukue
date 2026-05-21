import type { LevelPack } from '../types'
import { normalizeLevels } from './normalizeLevels'
import {
  LEVELS_BACKUP_INDEX_KEY,
  LEVELS_BACKUP_PREFIX,
  MAX_BACKUPS,
} from './storage'

export type BackupEntry = {
  id: string
  /** 表示名（日付必須）例: 2026-05-19 14:30:05 */
  label: string
  createdAt: number
}

function backupDataKey(id: string): string {
  return `${LEVELS_BACKUP_PREFIX}${id}`
}

/** localStorage 用 ID（日付を含む） */
export function formatBackupId(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day}_${h}-${min}-${s}`
}

export function formatBackupLabel(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function readIndex(): BackupEntry[] {
  try {
    const raw = localStorage.getItem(LEVELS_BACKUP_INDEX_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as BackupEntry[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeIndex(list: BackupEntry[]): void {
  localStorage.setItem(LEVELS_BACKUP_INDEX_KEY, JSON.stringify(list))
}

export function listBackups(): BackupEntry[] {
  return readIndex().sort((a, b) => b.createdAt - a.createdAt)
}

/** 日付入りバックアップを1件追加。戻り値は表示ラベル */
export function createBackup(levels: LevelPack[]): string {
  const now = new Date()
  const id = formatBackupId(now)
  const label = formatBackupLabel(now)
  const payload = JSON.stringify(normalizeLevels(levels))

  localStorage.setItem(backupDataKey(id), payload)

  let index = readIndex()
  index = [{ id, label, createdAt: now.getTime() }, ...index.filter((e) => e.id !== id)]

  while (index.length > MAX_BACKUPS) {
    const removed = index.pop()
    if (removed) localStorage.removeItem(backupDataKey(removed.id))
  }

  writeIndex(index)
  return label
}

export function loadBackup(id: string): LevelPack[] | null {
  try {
    const raw = localStorage.getItem(backupDataKey(id))
    if (!raw) return null
    const data = JSON.parse(raw) as LevelPack[]
    if (!Array.isArray(data) || data.length === 0) return null
    return normalizeLevels(data)
  } catch {
    return null
  }
}

export function deleteBackup(id: string): void {
  localStorage.removeItem(backupDataKey(id))
  writeIndex(readIndex().filter((e) => e.id !== id))
}
