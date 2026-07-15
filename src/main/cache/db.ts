import { app } from 'electron'
import { join } from 'node:path'
import Database from 'better-sqlite3'

let instance: Database.Database | null = null

export function getCacheDb(): Database.Database {
  if (!instance) {
    const dbPath = join(app.getPath('userData'), 'bad-cuz-dad-cache.sqlite')
    instance = new Database(dbPath)
    instance.pragma('journal_mode = WAL')
  }
  return instance
}
