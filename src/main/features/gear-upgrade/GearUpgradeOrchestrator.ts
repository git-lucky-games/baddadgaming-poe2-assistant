import type { GggApiClient } from '../../services/GggApiClient'
import type { TradeApiClient } from '../../services/TradeApiClient'
import type { PoeNinjaClient } from '../../services/PoeNinjaClient'
import type { GggItem, SlotUpgrades } from '@shared/types'
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

  async scanCharacter(accountName: string, character: string, league: string): Promise<SlotUpgrades[]> {
    const items = await this.gggApiClient.getCharacterItems(accountName, character)
    const equipped = items.filter((item) => GEAR_SLOTS.has(item.inventoryId))

    const [divineRate, holdings] = await Promise.all([
      this.poeNinjaClient.getDivineRate(league),
      this.gggApiClient.getCurrencyHoldings(accountName, league).catch(() => null)
    ])
    const walletDivine = holdings ? this.totalDivine(holdings, divineRate.rates) : null

    const results: SlotUpgrades[] = []
    for (const item of equipped) {
      const currentStats = this.extractStats(item)
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

  private totalDivine(holdings: Record<string, number>, divineRates: Record<string, number>): number {
    let total = holdings.divine ?? 0
    for (const [currencyId, amount] of Object.entries(holdings)) {
      if (currencyId === 'divine') continue
      const rate = divineRates[currencyId]
      if (rate) total += amount / rate
    }
    return total
  }
}
