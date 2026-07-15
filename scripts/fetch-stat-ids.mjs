// Refreshes data/stat-ids.json from GGG's trade API. Stat IDs and their
// templated text change as new leagues add mods, so re-run this each league
// (or if TradeQueryBuilder starts failing to match a mod you know exists).
//
//   node scripts/fetch-stat-ids.mjs

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://www.pathofexile.com/api/trade2/data/stats'
const OUTPUT_PATH = fileURLToPath(new URL('../data/stat-ids.json', import.meta.url))

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'BadCuzDad/0.1 (POE2 gear assistant; +https://github.com/git-lucky-games/baddadgaming-poe2-assistant)' }
  })

  if (!response.ok) {
    throw new Error(`GGG stats endpoint returned ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const groups = data.result ?? []

  await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')

  console.log(`Wrote ${OUTPUT_PATH}`)
  for (const group of groups) {
    console.log(`  ${group.id.padEnd(12)} ${group.entries.length} entries`)
  }
}

main().catch((err) => {
  console.error('Failed to fetch stat IDs:', err)
  process.exitCode = 1
})
