// One-off verification of GggApiClient's endpoint assumptions against a real
// account — confirms whether `realm=poe2` and the stash tab shape are right
// before trusting them in the app. Standalone (plain fetch, no Electron), so
// it runs without a display.
//
// SAFETY: your POESESSID is a session credential — never share it, commit it,
// or paste it anywhere outside your own terminal/env. This script only reads
// it from an environment variable and never prints it.
//
//   POESESSID=xxxx ACCOUNT_NAME="YourName#1234" LEAGUE="Standard" node scripts/verify-ggg-api.mjs

const POESESSID = process.env.POESESSID
const ACCOUNT_NAME = process.env.ACCOUNT_NAME
const LEAGUE = process.env.LEAGUE ?? 'Standard'

if (!POESESSID || !ACCOUNT_NAME) {
  console.error('Set POESESSID and ACCOUNT_NAME env vars first — see the header comment in this file.')
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

  const stashTabs = await call(
    'getStashTabs (tabs=1)',
    `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(ACCOUNT_NAME)}&league=${encodeURIComponent(LEAGUE)}&tabs=1&realm=poe2`
  )

  const currencyTab = stashTabs?.tabs?.find((t) => t.type === 'CurrencyStash')
  if (currencyTab && currencyTab.i !== undefined) {
    await call(
      `getStashTabItems (currency tab "${currencyTab.n}")`,
      `https://www.pathofexile.com/character-window/get-stash-items?accountName=${encodeURIComponent(ACCOUNT_NAME)}&league=${encodeURIComponent(LEAGUE)}&tabIndex=${currencyTab.i}&realm=poe2`
    )
  } else {
    console.log(
      '\nNo tab with type "CurrencyStash" found — either you have no dedicated currency tab, or that type name assumption is wrong. Check the tabs list above.'
    )
  }

  console.log(
    '\nDone. Compare these shapes against GggCharacter/GggItem/GggStashTab/GggStashItem in src/shared/types.ts and src/main/services/GggApiClient.ts, then tell Claude what differs (field names, missing data, etc.) — no need to share raw output if it contains anything you consider private, a description of the differences is enough.'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
