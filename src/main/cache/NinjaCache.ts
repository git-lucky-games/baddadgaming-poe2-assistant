import type { DivineRate } from '../services/PoeNinjaClient'
import { getCacheDb } from './db'

// Divine rate barely moves within an hour — matches the memory doc's "hourly refresh" plan.
const TTL_MS = 60 * 60 * 1000

export interface NinjaCacheStore {
  get(league: string): DivineRate | undefined
  set(league: string, rate: DivineRate): void
}

export class SqliteNinjaCache implements NinjaCacheStore {
  constructor() {
    getCacheDb().exec(`
      CREATE TABLE IF NOT EXISTS ninja_cache (
        league TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)
  }

  get(league: string): DivineRate | undefined {
    const db = getCacheDb()
    const row = db.prepare('SELECT payload, created_at FROM ninja_cache WHERE league = ?').get(league) as
      | { payload: string; created_at: number }
      | undefined
    if (!row) return undefined
    if (Date.now() - row.created_at > TTL_MS) {
      db.prepare('DELETE FROM ninja_cache WHERE league = ?').run(league)
      return undefined
    }
    return JSON.parse(row.payload)
  }

  set(league: string, rate: DivineRate): void {
    getCacheDb()
      .prepare(
        `INSERT INTO ninja_cache (league, payload, created_at) VALUES (?, ?, ?)
         ON CONFLICT(league) DO UPDATE SET payload = excluded.payload, created_at = excluded.created_at`
      )
      .run(league, JSON.stringify(rate), Date.now())
  }
}
