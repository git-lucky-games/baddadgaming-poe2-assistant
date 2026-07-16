import type { HttpRequestOptions, HttpResponse } from './HttpClient'
import type { NinjaCacheStore } from '../cache/NinjaCache'
import type { DivineRate } from '@shared/types'
import { USER_AGENT } from './userAgent'

export type { DivineRate } from '@shared/types'

// poe.ninja's current (2026) API — verified live against poe.ninja/docs/api. Its
// predecessor (/api/data/currencyoverview) is gone (404s), so don't reintroduce it.
const BASE_URL = 'https://poe.ninja/poe2/api/economy'

export class PoeNinjaError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`poe.ninja ${endpoint} failed with status ${status}: ${body}`)
    this.name = 'PoeNinjaError'
  }
}

export interface NinjaLeague {
  id: string
  name: string
}

export interface CurrencyMeta {
  id: string
  name: string
  image: string
  category: string
  detailsId: string
}

export interface CurrencyExchangeLine {
  id: string
  primaryValue: number
  volumePrimaryValue: number
  maxVolumeCurrency: string
  maxVolumeRate: number
}

export interface CurrencyExchangeOverview {
  core: {
    primary: string
    secondary: string
    /** currency id -> how many of it equal 1 unit of `primary`. */
    rates: Record<string, number>
    items: CurrencyMeta[]
  }
  lines: CurrencyExchangeLine[]
  items: CurrencyMeta[]
}

export class PoeNinjaClient {
  constructor(
    private readonly httpRequest: (options: HttpRequestOptions) => Promise<HttpResponse>,
    private readonly cache: NinjaCacheStore
  ) {}

  async getLeagues(): Promise<NinjaLeague[]> {
    const res = await this.httpRequest({ method: 'GET', url: `${BASE_URL}/leagues`, headers: this.headers() })
    if (res.status !== 200) throw new PoeNinjaError('leagues', res.status, res.body)
    return JSON.parse(res.body)
  }

  async getCurrencyOverview(league: string): Promise<CurrencyExchangeOverview> {
    const url = `${BASE_URL}/exchange/current/overview?league=${encodeURIComponent(league)}&type=Currency`
    const res = await this.httpRequest({ method: 'GET', url, headers: this.headers() })
    if (res.status !== 200) throw new PoeNinjaError('exchange/current/overview', res.status, res.body)
    return JSON.parse(res.body)
  }

  /**
   * Cache-aside (1hr TTL). POE2's economy currently prices everything relative
   * to the Divine Orb (`core.primary === "divine"`). If that ever stops being
   * true this throws rather than silently returning rates relative to the
   * wrong currency.
   */
  async getDivineRate(league: string): Promise<DivineRate> {
    const cached = this.cache.get(league)
    if (cached) return cached

    const overview = await this.getCurrencyOverview(league)
    if (overview.core.primary !== 'divine') {
      throw new PoeNinjaError(
        'exchange/current/overview',
        0,
        `expected Divine Orb as the primary reference currency, got "${overview.core.primary}"`
      )
    }
    const rate: DivineRate = { rates: overview.core.rates, fetchedAt: Date.now() }
    this.cache.set(league, rate)
    return rate
  }

  private headers(): Record<string, string> {
    return { 'User-Agent': USER_AGENT }
  }
}
