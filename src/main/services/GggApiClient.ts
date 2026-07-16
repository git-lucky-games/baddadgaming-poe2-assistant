import type { HttpRequestOptions, HttpResponse } from './HttpClient'
import type { RateLimiter } from './RateLimiter'
import { USER_AGENT } from './userAgent'

const BASE_URL = 'https://www.pathofexile.com'

export class GggApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`GGG API ${endpoint} failed with status ${status}`)
    this.name = 'GggApiError'
  }
}

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

export interface GggStashTab {
  id: string
  n: string
  type: string
  i?: number
}

export interface GggStashItem {
  typeLine: string
  stackSize?: number
}

// Maps stash item typeLine -> the currency id PoeNinjaClient's divine-rate map uses.
const CURRENCY_TYPE_LINE_MAP: Record<string, string> = {
  'Divine Orb': 'divine',
  'Exalted Orb': 'exalted',
  'Chaos Orb': 'chaos'
}

/**
 * Legacy character-window API, used via POESESSID cookie — not GGG's documented
 * OAuth API (which has no POE2 stash support at all, and whose app registration
 * is currently closed anyway). See project memory for the full ToS context.
 *
 * The `realm=poe2` query param and the stash endpoints' response shapes are
 * UNVERIFIED against a real account — inferred from POE1's long-stable legacy
 * format plus the `realm` convention GGG's official API uses elsewhere. Needs
 * confirmation against a real POESESSID before being fully trusted.
 */
export class GggApiClient {
  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly getPoesessid: () => string,
    private readonly httpRequest: (options: HttpRequestOptions) => Promise<HttpResponse>
  ) {}

  async getCharacters(accountName: string): Promise<GggCharacter[]> {
    const url = `${BASE_URL}/character-window/get-characters?accountName=${encodeURIComponent(accountName)}&realm=poe2`
    return this.request<GggCharacter[]>('get-characters', 'ggg-character', url)
  }

  async getCharacterItems(accountName: string, character: string): Promise<GggItem[]> {
    const url = `${BASE_URL}/character-window/get-items?accountName=${encodeURIComponent(accountName)}&character=${encodeURIComponent(character)}&realm=poe2`
    const parsed = await this.request<{ items?: GggItem[] }>('get-items', 'ggg-character', url)
    return parsed.items ?? []
  }

  async getStashTabs(accountName: string, league: string): Promise<GggStashTab[]> {
    const url = `${BASE_URL}/character-window/get-stash-items?accountName=${encodeURIComponent(accountName)}&league=${encodeURIComponent(league)}&tabs=1&realm=poe2`
    const parsed = await this.request<{ tabs?: GggStashTab[] }>('get-stash-items(tabs)', 'ggg-stash', url)
    return parsed.tabs ?? []
  }

  async getStashTabItems(accountName: string, league: string, tabIndex: number): Promise<GggStashItem[]> {
    const url = `${BASE_URL}/character-window/get-stash-items?accountName=${encodeURIComponent(accountName)}&league=${encodeURIComponent(league)}&tabIndex=${tabIndex}&realm=poe2`
    const parsed = await this.request<{ items?: GggStashItem[] }>('get-stash-items(tab)', 'ggg-stash', url)
    return parsed.items ?? []
  }

  /**
   * Best-effort currency total from dedicated currency-type stash tabs only —
   * won't count currency kept in normal/quad/other tabs. Throws like every
   * other method here on failure; callers (the Orchestrator) decide whether
   * to degrade gracefully rather than this client silently hiding errors.
   */
  async getCurrencyHoldings(accountName: string, league: string): Promise<Record<string, number>> {
    const tabs = await this.getStashTabs(accountName, league)
    const currencyTabs = tabs.filter((tab) => tab.type === 'CurrencyStash')
    const totals: Record<string, number> = {}

    for (const tab of currencyTabs) {
      if (tab.i === undefined) continue
      const items = await this.getStashTabItems(accountName, league, tab.i)
      for (const item of items) {
        const currencyId = CURRENCY_TYPE_LINE_MAP[item.typeLine]
        if (!currencyId) continue
        totals[currencyId] = (totals[currencyId] ?? 0) + (item.stackSize ?? 0)
      }
    }

    return totals
  }

  private async request<T>(endpoint: string, bucket: string, url: string): Promise<T> {
    await this.rateLimiter.acquire(bucket)
    const res = await this.httpRequest({
      method: 'GET',
      url,
      headers: { 'User-Agent': USER_AGENT, Cookie: `POESESSID=${this.getPoesessid()}` }
    })
    this.rateLimiter.recordResponse(bucket, res.headers, res.status)
    if (res.status !== 200) throw new GggApiError(endpoint, res.status, res.body)
    return JSON.parse(res.body)
  }
}
