// One-off verification of GggApiClient's character endpoints against a real
// account — confirms `realm=poe2` and the character/item shapes are right
// before trusting them in the app. Standalone (plain fetch, no Electron), so
// it runs without a display.
//
// Stash access isn't checked here — confirmed dead for POE2 (2026-07-15) via
// GGG's docs (Account Stashes is PoE1-only), a live 400 "Invalid query" from
// this same legacy endpoint with realm=poe2, and an unanswered GGG forum
// thread asking this exact question since Dec 2024. See project memory.
//
// SAFETY: your POESESSID is a session credential — never share it, commit it,
// or paste it anywhere outside your own terminal/env. This script only reads
// it from an environment variable and never prints it.
//
//   POESESSID=xxxx ACCOUNT_NAME="YourName#1234" node scripts/verify-ggg-api.mjs

const POESESSID = process.env.POESESSID
const ACCOUNT_NAME = process.env.ACCOUNT_NAME

if (!POESESSID || !ACCOUNT_NAME) {
  const missing = []
  if (!POESESSID) missing.push('POESESSID')
  if (!ACCOUNT_NAME) missing.push('ACCOUNT_NAME')
  console.error(`Missing env var(s): ${missing.join(', ')}. See the header comment in this file.`)
  console.error('Here is what this script actually sees right now (lengths only, never the values):')
  for (const key of ['POESESSID', 'ACCOUNT_NAME']) {
    const value = process.env[key]
    console.error(`  ${key}: ${value ? `set, length ${value.length}` : 'NOT SET'}`)
  }
  process.exit(1)
}

const USER_AGENT = 'BadCuzDad/0.1 (POE2 gear assistant verification script; contact: akarvell@gmail.com)'

async function call(label, url) {
  console.log(`\n=== ${label} ===`)
  console.log(url.replace(encodeURIComponent(ACCOUNT_NAME), '<account>'))
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Cookie: `POESESSID=${POESESSID}` } })
  console.log('status:', res.status)
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    console.log(JSON.stringify(json, null, 2).slice(0, 2000))
    return json
  } catch {
    console.log('(not JSON) first 500 chars:', text.slice(0, 500))
    return null
  }
}

async function main() {
  const characters = await call(
    'getCharacters (realm=poe2)',
    `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(ACCOUNT_NAME)}&realm=poe2`
  )

  const firstCharacterName = characters?.[0]?.name
  if (firstCharacterName) {
    await call(
      `getCharacterItems (${firstCharacterName})`,
      `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(ACCOUNT_NAME)}&character=${encodeURIComponent(firstCharacterName)}&realm=poe2`
    )
  } else {
    console.log('\nNo characters returned — skipping getCharacterItems. This alone tells us realm=poe2 is probably wrong.')
  }

  console.log(
    '\nDone. Compare these shapes against GggCharacter/GggItem in src/shared/types.ts, then tell Claude what differs (field names, missing data, etc.) — no need to share raw output if it contains anything you consider private, a description of the differences is enough.'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
