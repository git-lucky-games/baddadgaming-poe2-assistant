import type { HttpRequestOptions, HttpResponse } from './HttpClient'
import type { RateLimiter } from './RateLimiter'
import type { TradeCacheStore } from '../cache/TradeCache'
import type {
  TradeSearchBody,
  TradeItem,
  TradeSearchResponse,
  TradeFetchResponse
} from '../features/gear-upgrade/TradeQueryBuilder'
import { USER_AGENT } from './userAgent'

const BASE_URL = 'https://www.pathofexile.com'
// GGG's fetch endpoint accepts at most 10 ids per call.
const FETCH_BATCH_SIZE = 10

export class TradeApiError extends Error {
  constructor(
    public readonly endpoint: 'search' | 'fetch',
    public readonly status: number,
    public readonly body: string
  ) {
    super(`Trade API ${endpoint} failed with status ${status}`)
    this.name = 'TradeApiError'
  }
}

export class TradeApiClient {
  constructor(
    private readonly rateLimiter: RateLimiter,
    private readonly cache: TradeCacheStore,
    private readonly getPoesessid: () => string,
    private readonly httpRequest: (options: HttpRequestOptions) => Promise<HttpResponse>
  ) {}

  async search(league: string, body: TradeSearchBody): Promise<TradeSearchResponse> {
    await this.rateLimiter.acquire('trade-search')
    const res = await this.httpRequest({
      method: 'POST',
      url: `${BASE_URL}/api/trade2/search/${encodeURIComponent(league)}`,
      headers: this.headers(),
      body: JSON.stringify(body)
    })
    this.rateLimiter.recordResponse('trade-search', res.headers, res.status)
    if (res.status !== 200) throw new TradeApiError('search', res.status, res.body)
    return JSON.parse(res.body)
  }

  async fetch(ids: string[], queryId: string): Promise<TradeItem[]> {
    const items: TradeItem[] = []
    for (let i = 0; i < ids.length; i += FETCH_BATCH_SIZE) {
      const batch = ids.slice(i, i + FETCH_BATCH_SIZE)
      await this.rateLimiter.acquire('trade-fetch')
      const res = await this.httpRequest({
        method: 'GET',
        url: `${BASE_URL}/api/trade2/fetch/${batch.join(',')}?query=${queryId}`,
        headers: this.headers()
      })
      this.rateLimiter.recordResponse('trade-fetch', res.headers, res.status)
      if (res.status !== 200) throw new TradeApiError('fetch', res.status, res.body)
      const parsed: TradeFetchResponse = JSON.parse(res.body)
      for (const item of parsed.result) {
        if (item) items.push(item)
      }
    }
    return items
  }

  /** Cache-aside search+fetch — the entry point orchestrators should normally use. */
  async searchAndFetch(league: string, body: TradeSearchBody, maxResults = 10): Promise<TradeItem[]> {
    const cacheKey = this.cache.buildKey(league, body)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    const searchResult = await this.search(league, body)
    const ids = searchResult.result.slice(0, maxResults)
    const items = ids.length > 0 ? await this.fetch(ids, searchResult.id) : []

    this.cache.set(cacheKey, league, items)
    return items
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      Cookie: `POESESSID=${this.getPoesessid()}`
    }
  }
}
