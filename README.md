# POE2 Bad Dad Gaming Assistant

A Path of Exile 2 companion tool for the Bad Dad Gaming community — "Bad Cuz Dad."

## About

This assistant helps POE2 players with builds, items, crafting, and game mechanics. It's a local-only Electron desktop app: no server, no external AI dependency — you provide your own POESESSID and everything runs on your machine.

## Features

1. **Gear Upgrade Assistant** — fetches your equipped gear and searches the trade marketplace for affordable stat upgrades per slot.
2. **Instant Clipboard Price Lookup** — hover an item and press Ctrl+C (POE's native item-export hotkey); the item text is parsed and looked up on the trade API.
3. **High-Value Item Auto-Detection** — passive clipboard monitor alerts you when a copied item's value exceeds a divine orb threshold.

## Development

```bash
npm install
npm run dev        # start the app in dev mode
npm run typecheck   # check main + renderer types
npm run build       # production build to out/
```

## Tech Stack

Electron 33 · React 19 + TypeScript · Tailwind CSS v4 · electron-vite · Zustand · better-sqlite3
