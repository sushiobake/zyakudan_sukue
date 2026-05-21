/**
 * Vite キャッシュと dist を削除してから dev サーバーを起動する。
 * Windows / macOS / Linux 共通。
 */
import { rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const CACHE_DIRS = ['node_modules/.vite', 'dist']

for (const dir of CACHE_DIRS) {
  try {
    rmSync(dir, { recursive: true, force: true })
    console.log(`[dev:clean] removed ${dir}`)
  } catch {
    // 無くても問題なし
  }
}

console.log('[dev:clean] starting vite...')
const result = spawnSync('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
})

process.exit(result.status ?? 1)
