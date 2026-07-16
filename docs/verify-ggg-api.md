# Verifying the GGG API against your real account

Quick reference for running `scripts/verify-ggg-api.mjs` — confirms whether the
`realm=poe2` and stash-tab shape assumptions in `GggApiClient` actually hold
against a real account. Do this from any machine with a browser and Node.js —
it does not need POE2 installed, just a logged-in pathofexile.com session.

**Never paste your POESESSID value anywhere outside your own terminal** — not
in chat, not in a commit, not in an issue. It's a session credential.

## 1. Find your POESESSID

1. Open a browser and log into https://www.pathofexile.com
2. Open DevTools:
   - Chrome/Edge: F12, or Ctrl+Shift+I → **Application** tab → **Storage** → **Cookies** → `https://www.pathofexile.com`
   - Firefox: F12 → **Storage** tab → **Cookies** → `https://www.pathofexile.com`
3. Find the cookie named `POESESSID` and copy its **Value** column — that long string is what you need.

## 2. Find your account name

Your account name including the discriminator, e.g. `YourName#1234` — shown in-game, or on your profile page at pathofexile.com (click your name in the top right).

## 3. Run the script (Linux/bash)

From the repo root:

```bash
POESESSID=paste_the_cookie_value_here ACCOUNT_NAME="YourName#1234" node scripts/verify-ggg-api.mjs
```

Optional: add a specific league if "Standard" isn't the one you want checked:

```bash
POESESSID=paste_the_cookie_value_here ACCOUNT_NAME="YourName#1234" LEAGUE="Your League Name" node scripts/verify-ggg-api.mjs
```

## 4. What to send back

The script prints response shapes to your terminal (never the POESESSID itself). Share what came back — a description of what differs, or the printed output if you're comfortable with it (character names and stash tab names aren't especially sensitive, but skip pasting anything you'd rather keep private, a summary is enough).
