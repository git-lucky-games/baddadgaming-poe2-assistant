import { parseModText, type StatGroupId } from './TradeQueryBuilder'
import type { TradeItem, PriceTier, StatDelta, RankedUpgrade } from '@shared/types'

export type { PriceTier, StatDelta, RankedUpgrade }

export interface CurrentItemStat {
  group: StatGroupId
  /** Concrete mod text as it appears on the current item, e.g. "+45 to maximum Life". */
  modText: string
  /**
   * First numeric value in the mod. Range mods (e.g. "Adds 5 to 10 Physical
   * Damage") have a second value that's currently ignored — known v1
   * simplification, revisit if damage-range slots need finer comparison.
   */
  value: number
}

export function priceToDivine(
  price: { amount: number; currency: string } | null,
  divineRates: Record<string, number>
): number | null {
  if (!price) return null
  if (price.currency === 'divine') return price.amount
  const rate = divineRates[price.currency]
  if (!rate) return null
  return price.amount / rate
}

/** Per-stat comparison against the current item — feeds both the lift score and StatDeltaBadge in the UI. */
export function computeStatDeltas(item: TradeItem, currentStats: CurrentItemStat[]): StatDelta[] {
  const allMods = [
    ...(item.item.explicitMods ?? []),
    ...(item.item.implicitMods ?? []),
    ...(item.item.craftedMods ?? []),
    ...(item.item.fracturedMods ?? []),
    ...(item.item.enchantMods ?? [])
  ]

  const deltas: StatDelta[] = []
  for (const stat of currentStats) {
    const { template } = parseModText(stat.modText)
    const match = allMods.find((mod) => parseModText(mod).template === template)
    if (!match) continue
    const candidateValue = parseModText(match).values[0] ?? 0
    deltas.push({ modText: stat.modText, currentValue: stat.value, candidateValue, delta: candidateValue - stat.value })
  }
  return deltas
}

export function computeLiftScore(item: TradeItem, currentStats: CurrentItemStat[]): number {
  return computeStatDeltas(item, currentStats).reduce((sum, d) => sum + d.delta, 0)
}

function quartileTier(sortedIndex: number, total: number): PriceTier {
  if (total <= 1) return 'market-value'
  const percentile = sortedIndex / (total - 1)
  if (percentile < 0.25) return 'great-deal'
  if (percentile < 0.5) return 'cheap-enough'
  if (percentile < 0.75) return 'market-value'
  return 'higher-than-normal'
}

export function rankUpgrades(
  items: TradeItem[],
  currentStats: CurrentItemStat[],
  divineRates: Record<string, number>,
  walletDivine: number | null
): RankedUpgrade[] {
  const priced = items
    .map((item) => ({ item, priceInDivine: priceToDivine(item.listing.price, divineRates) }))
    .filter((entry): entry is { item: TradeItem; priceInDivine: number } => entry.priceInDivine !== null)

  const sortedByPrice = [...priced].sort((a, b) => a.priceInDivine - b.priceInDivine)
  const tierByItemId = new Map<string, PriceTier>()
  sortedByPrice.forEach((entry, index) => {
    tierByItemId.set(entry.item.id, quartileTier(index, sortedByPrice.length))
  })

  const valuePerDivine = priced.map((entry) => ({
    id: entry.item.id,
    value: entry.priceInDivine > 0 ? computeLiftScore(entry.item, currentStats) / entry.priceInDivine : 0
  }))
  const sortedValues = valuePerDivine.map((v) => v.value).sort((a, b) => a - b)
  const medianValue = sortedValues.length > 0 ? sortedValues[Math.floor(sortedValues.length / 2)] : 0
  const bestValueIds = new Set(
    medianValue > 0 ? valuePerDivine.filter((v) => v.value >= medianValue * 1.5).map((v) => v.id) : []
  )

  return priced.map(({ item, priceInDivine }) => ({
    item,
    priceInDivine,
    priceTier: tierByItemId.get(item.id) ?? 'market-value',
    isBestValue: bestValueIds.has(item.id),
    affordable: walletDivine === null ? null : priceInDivine <= walletDivine,
    statDeltas: computeStatDeltas(item, currentStats)
  }))
}
