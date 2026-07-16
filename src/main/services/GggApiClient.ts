import type { HttpRequestOptions, HttpResponse } from './HttpClient'
import type { RateLimiter } from './RateLimiter'
import type { GggCharacter, GggItem } from '@shared/types'
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

/**
 * Legacy character-window API, used via POESESSID cookie — not GGG's documented
 * OAuth API (whose app registration is currently closed anyway). See project
 * memory for the full ToS context.
 *
 * `realm=poe2` confirmed working here for characters/items against a real
 * account (2026-07-15). There is no stash access for POE2 through any method,
 * official or legacy — confirmed via GGG's docs (Account Stashes is PoE1-only),
 * a live 400 "Invalid query" from this same endpoint with realm=poe2, and an
 * unanswered GGG forum thread asking this exact question since Dec 2024. Don't
 * re-add stash methods here without new information changing that.
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
