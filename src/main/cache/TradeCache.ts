import { createHash } from 'node:crypto'
import type { TradeItem, TradeSearchBody } from '../features/gear-upgrade/TradeQueryBuilder'
import { getCacheDb } from './db'

// Trade listings go stale fast (items sell within minutes) — 3 min balances
// avoiding a search+fetch round trip against showing sold-out results.
const TTL_MS = 3 * 60 * 1000

export interface TradeCacheStore {
  get(key: string): TradeItem[] | undefined
  set(key: string, league: string, items: TradeItem[]): void
  buildKey(league: string, body: TradeSearchBody): string
}

export class SqliteTradeCache implements TradeCacheStore {
  constructor() {
    getCacheDb().exec(`
      CREATE TABLE IF NOT EXISTS trade_cache (
        cache_key TEXT PRIMARY KEY,
        league TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)
  }

  buildKey(league: string, body: TradeSearchBody): string {
    return createHash('sha1').update(`${league}:${JSON.stringify(body)}`).digest('hex')
  }

  get(key: string): TradeItem[] | undefined {
    const db = getCacheDb()
    const row = db.prepare('SELECT payload, created_at FROM trade_cache WHERE cache_key = ?').get(key) as
      | { payload: string; created_at: number }
      | undefined
    if (!row) return undefined
    if (Date.now() - row.created_at > TTL_MS) {
      db.prepare('DELETE FROM trade_cache WHERE cache_key = ?').run(key)
      return undefined
    }
    return JSON.parse(row.payload)
  }

  set(key: string, league: string, items: TradeItem[]): void {
    getCacheDb()
      .prepare(
        `INSERT INTO trade_cache (cache_key, league, payload, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, created_at = excluded.created_at`
      )
      .run(key, league, JSON.stringify(items), Date.now())
  }
}
