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
const CHARACTER_NAME = process.env.CHARACTER_NAME

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
  // Diagnostic mode (2026-07-16): get-characters&realm=poe2 was only ever
  // returning ONE character (an old SSF alt) despite the account having
  // several higher-level characters confirmed real via poe.ninja/the
  // official site. Trying every plausible `realm` value in one pass to see
  // which one(s), if any, actually return the missing characters.
  const realmsToTry = ['poe2', 'pc', 'pc2', '']

  for (const realm of realmsToTry) {
    const url =
      `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(ACCOUNT_NAME)}` +
      (realm ? `&realm=${realm}` : '')
    const characters = await call(`getCharacters (realm=${realm || '(omitted)'})`, url)
    const names = Array.isArray(characters) ? characters.map((c) => c.name) : null
    console.log('character names:', names ?? '(not an array / error)')
  }

  // Narrower question (2026-07-16): even if get-characters can't LIST the
  // real PoE2 roster, does get-items still work for a character name we
  // already know from another source (site/poe.ninja)? If yes, a manual
  // character-name text field could still work around the broken listing
  // call. Set CHARACTER_NAME to test this.
  if (CHARACTER_NAME) {
    const url = `https://www.pathofexile.com/character-window/get-items?accountName=${encodeURIComponent(ACCOUNT_NAME)}&character=${encodeURIComponent(CHARACTER_NAME)}&realm=poe2`
    const result = await call(`getCharacterItems (${CHARACTER_NAME}, realm=poe2)`, url)
    const itemCount = Array.isArray(result?.items) ? result.items.length : null
    console.log(`item count for ${CHARACTER_NAME}:`, itemCount ?? '(no items array / error — see status/body above)')
  } else {
    console.log('\n(Set CHARACTER_NAME env var to also test get-items directly against a known real character name.)')
  }

  console.log(
    '\nDone. Look at which realm value(s) above actually listed CholaMasFina / Hopesolow / getrattedbud, then tell Claude which one(s) worked — no need to share full raw output, just which realm values found which characters is enough.'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
