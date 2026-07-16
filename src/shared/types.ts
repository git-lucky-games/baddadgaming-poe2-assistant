export interface CurrencyHoldings {
  divine: number
  exalted: number
  chaos: number
}

export interface AppConfig {
  poesessid: string
  accountName: string
  league: string
  /**
   * Manually entered — POE2 stash currency isn't readable through any GGG API
   * (official or legacy), confirmed 2026-07-15. Used only for the optional
   * affordability signal on gear upgrades; leaving everything at 0 just means
   * that signal shows "unknown" instead of a real afford/can't-afford call.
   */
  currencyHoldings: CurrencyHoldings
}

// --- Trade API domain types (also used over IPC by the renderer) ---

export interface TradeListing {
  method: string
  indexed: string
  price: { type: string; amount: number; currency: string } | null
  account: {
    name: string
    lastCharacterName?: string
    online?: { status?: string } | null
  }
  whisper: string | null
}

export interface TradeItemDetails {
  name?: string
  typeLine: string
  baseType?: string
  ilvl?: number
  identified: boolean
  corrupted?: boolean
  mirrored?: boolean
  explicitMods?: string[]
  implicitMods?: string[]
  craftedMods?: string[]
  fracturedMods?: string[]
  enchantMods?: string[]
  frameType?: number
}

/** One priced listing from a trade fetch call. */
export interface TradeItem {
  id: string
  listing: TradeListing
  item: TradeItemDetails
}

// --- GGG character/gear domain types ---

export interface GggCharacter {
  name: string
  league: string
  level: number
  class: string
}

export interface GggItem {
  id: string
  name: string
  typeLine: string
  baseType?: string
  ilvl?: number
  /** Equipment slot, e.g. "Helm", "BodyArmour", "Weapon", "Ring2". Also covers non-gear slots (flasks, etc) — filter by slot before treating as gear. */
  inventoryId: string
  identified: boolean
  corrupted?: boolean
  explicitMods?: string[]
  implicitMods?: string[]
  craftedMods?: string[]
  fracturedMods?: string[]
  enchantMods?: string[]
  frameType?: number
}

// --- Gear Upgrade feature result types ---

export type PriceTier = 'great-deal' | 'cheap-enough' | 'market-value' | 'higher-than-normal'

export interface StatDelta {
  /** Current item's mod text, used as the display label for this stat row. */
  modText: string
  currentValue: number
  candidateValue: number
  delta: number
}

export interface RankedUpgrade {
  item: TradeItem
  priceInDivine: number
  priceTier: PriceTier
  isBestValue: boolean
  /** null = user hasn't entered any currency holdings yet, not "can't afford". */
  affordable: boolean | null
  statDeltas: StatDelta[]
}

export interface SlotUpgrades {
  slot: string
  currentItem: GggItem
  upgrades: RankedUpgrade[]
}
