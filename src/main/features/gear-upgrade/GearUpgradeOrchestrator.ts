import type { GggApiClient } from '../../services/GggApiClient'
import type { TradeApiClient } from '../../services/TradeApiClient'
import type { PoeNinjaClient } from '../../services/PoeNinjaClient'
import type { GggItem, SlotUpgrades, CurrencyHoldings } from '@shared/types'
import { resolveStatId, buildSearchBody, parseModText, type StatGroupId, type StatFilter } from './TradeQueryBuilder'
import { rankUpgrades, type CurrentItemStat } from './UpgradeRanker'

export type { SlotUpgrades }

const MOD_FIELDS: Array<{ field: keyof GggItem; group: StatGroupId }> = [
  { field: 'explicitMods', group: 'explicit' },
  { field: 'implicitMods', group: 'implicit' },
  { field: 'craftedMods', group: 'crafted' },
  { field: 'fracturedMods', group: 'fractured' },
  { field: 'enchantMods', group: 'enchant' }
]

// GGG's legacy inventoryId values for equipped gear slots (excludes flasks, which aren't "gear" for this feature).
const GEAR_SLOTS = new Set([
  'Weapon',
  'Weapon2',
  'Offhand',
  'Offhand2',
  'Helm',
  'BodyArmour',
  'Gloves',
  'Boots',
  'Amulet',
  'Ring',
  'Ring2',
  'Belt'
])

export class GearUpgradeOrchestrator {
  constructor(
    private readonly gggApiClient: GggApiClient,
    private readonly tradeApiClient: TradeApiClient,
    private readonly poeNinjaClient: PoeNinjaClient
  ) {}

  async scanCharacter(
    accountName: string,
    character: string,
    league: string,
    currencyHoldings: CurrencyHoldings,
    priorityStats: string[] = []
  ): Promise<SlotUpgrades[]> {
    const items = await this.gggApiClient.getCharacterItems(accountName, character)
    const equipped = items.filter((item) => GEAR_SLOTS.has(item.inventoryId))

    const divineRate = await this.poeNinjaClient.getDivineRate(league)
    const walletDivine = this.hasAnyCurrency(currencyHoldings)
      ? this.totalDivine(currencyHoldings, divineRate.rates)
      : null

    const results: SlotUpgrades[] = []
    for (const item of equipped) {
      const currentStats = this.relevantStats(this.extractStats(item), priorityStats)
      const filters = this.buildFilters(currentStats)

      if (filters.length === 0) {
        results.push({ slot: item.inventoryId, currentItem: item, upgrades: [] })
        continue
      }

      // Explicit price-ascending sort matters here: searchAndFetch only keeps the
      // first `maxResults` ids, so without this we could fetch an arbitrary
      // slice of matches instead of the actually-cheapest ones.
      const searchBody = buildSearchBody(filters, { status: 'online', sort: { price: 'asc' } })
      const candidates = await this.tradeApiClient.searchAndFetch(league, searchBody)
      const ranked = rankUpgrades(candidates, currentStats, divineRate.rates, walletDivine)
      results.push({ slot: item.inventoryId, currentItem: item, upgrades: ranked })
    }

    return results
  }

  private buildFilters(currentStats: CurrentItemStat[]): StatFilter[] {
    const filters: StatFilter[] = []
    for (const stat of currentStats) {
      const id = resolveStatId(stat.modText, stat.group)
      if (id) filters.push({ id, min: stat.value })
    }
    return filters
  }

  /**
   * With no priority keywords, every current stat is required (original
   * behavior). With priorities set, only stats matching one of them (case-
   * insensitive substring against the mod text) are required/ranked — this is
   * what stops a "dead" stat on the current item (e.g. leftover leveling-gear
   * Intelligence on a build that doesn't use it) from blocking a search that
   * would otherwise find a good upgrade.
   */
  private relevantStats(currentStats: CurrentItemStat[], priorityStats: string[]): CurrentItemStat[] {
    if (priorityStats.length === 0) return currentStats
    const keywords = priorityStats.map((k) => k.toLowerCase()).filter(Boolean)
    if (keywords.length === 0) return currentStats
    return currentStats.filter((stat) => {
      const modTextLower = stat.modText.toLowerCase()
      return keywords.some((keyword) => modTextLower.includes(keyword))
    })
  }

  private extractStats(item: GggItem): CurrentItemStat[] {
    const stats: CurrentItemStat[] = []
    for (const { field, group } of MOD_FIELDS) {
      const mods = item[field] as string[] | undefined
      if (!mods) continue
      for (const modText of mods) {
        const { values } = parseModText(modText)
        if (values.length === 0) continue
        stats.push({ group, modText, value: values[0] })
      }
    }
    return stats
  }

  private hasAnyCurrency(holdings: CurrencyHoldings): boolean {
    return holdings.divine > 0 || holdings.exalted > 0 || holdings.chaos > 0
  }

  private totalDivine(holdings: CurrencyHoldings, divineRates: Record<string, number>): number {
    let total = holdings.divine
    for (const [currencyId, amount] of Object.entries(holdings)) {
      if (currencyId === 'divine' || amount <= 0) continue
      const rate = divineRates[currencyId]
      if (rate) total += amount / rate
    }
    return total
  }
}
