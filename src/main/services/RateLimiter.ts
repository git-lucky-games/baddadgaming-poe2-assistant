/**
 * Header-driven rate limiter for GGG's trade API.
 *
 * GGG responses carry, per named rule (Ip, Account, Client...):
 *   X-Rate-Limit-{Rule}:       "12:10:60,15:30:120"   maxHits:periodSeconds:penaltySeconds, comma-separated windows
 *   X-Rate-Limit-{Rule}-State: "2:10:0,4:30:0"         currentHits:periodSeconds:penaltyRemainingSeconds
 * and X-Rate-Limit-Rules lists which rule names apply, e.g. "Ip,Account".
 * A 429 carries Retry-After (seconds) and must be obeyed as a hard stop.
 *
 * Model: each window is a token bucket. Tokens are refilled from the server's
 * authoritative `-State` header after every response (so it self-corrects for
 * anything else sharing the same account/IP), and decremented locally the
 * moment a request is allowed through (so back-to-back requests fired before
 * a response returns can't overrun the limit). A request must wait for every
 * window across every applicable rule to have a token before it can send —
 * exceeding any single one risks the ban this module exists to prevent.
 */

// Extra headroom subtracted from the server-reported remaining count, since
// our local view is always at least one response behind reality.
const SAFETY_BUFFER = 1

interface RuleWindow {
  maxHits: number
  periodSeconds: number
  penaltySeconds: number
}

interface WindowState extends RuleWindow {
  remaining: number
  blockedUntil: number
}

interface RuleState {
  name: string
  windows: WindowState[]
}

interface BucketState {
  rules: RuleState[]
  hardBlockedUntil: number
}

function parseTriplets(header: string): [number, number, number][] {
  return header
    .split(',')
    .map((triplet) => triplet.trim())
    .filter(Boolean)
    .map((triplet) => triplet.split(':').map(Number) as [number, number, number])
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RateLimiter {
  private buckets = new Map<string, BucketState>()
  private chains = new Map<string, Promise<void>>()

  /** Resolves once it's safe to send under every known window for this bucket. Call immediately before the request. */
  acquire(bucket: string): Promise<void> {
    const previous = this.chains.get(bucket) ?? Promise.resolve()
    const next = previous.then(() => this.waitAndReserve(bucket))
    this.chains.set(bucket, next)
    return next
  }

  /** Call with the response GGG returned, so future acquire() calls reflect reality. */
  recordResponse(bucket: string, headers: Record<string, string>, status: number): void {
    const state = this.getOrCreateBucket(bucket)
    const now = Date.now()

    const rulesHeader = headers['x-rate-limit-rules']
    if (rulesHeader) {
      state.rules = rulesHeader
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => this.mergeRule(state, name, headers, now))
    }

    if (status === 429) {
      const retryAfterRaw = Number(headers['retry-after'])
      const retryAfterSeconds = Number.isFinite(retryAfterRaw) && retryAfterRaw > 0 ? retryAfterRaw : 60
      state.hardBlockedUntil = Math.max(state.hardBlockedUntil, now + retryAfterSeconds * 1000)
    }
  }

  private mergeRule(
    state: BucketState,
    name: string,
    headers: Record<string, string>,
    now: number
  ): RuleState {
    const windowsHeader = headers[`x-rate-limit-${name.toLowerCase()}`]
    const stateHeader = headers[`x-rate-limit-${name.toLowerCase()}-state`]
    const windows = windowsHeader ? parseTriplets(windowsHeader) : []
    const states = stateHeader ? parseTriplets(stateHeader) : []
    const existing = state.rules.find((rule) => rule.name === name)

    const windowStates: WindowState[] = windows.map(([maxHits, periodSeconds, penaltySeconds], i) => {
      const current = states[i]?.[0] ?? 0
      const remaining = Math.max(0, maxHits - current - SAFETY_BUFFER)
      const ws: WindowState = existing?.windows[i] ?? { maxHits, periodSeconds, penaltySeconds, remaining, blockedUntil: 0 }
      ws.maxHits = maxHits
      ws.periodSeconds = periodSeconds
      ws.penaltySeconds = penaltySeconds
      this.refillWindow(ws, remaining, now)
      return ws
    })

    return { name, windows: windowStates }
  }

  private refillWindow(window: WindowState, serverRemaining: number, now: number): void {
    window.remaining = serverRemaining
    if (serverRemaining > 0) {
      window.blockedUntil = 0
    } else if (window.blockedUntil <= now) {
      window.blockedUntil = now + window.periodSeconds * 1000
    }
  }

  private decrementWindow(window: WindowState, now: number): void {
    window.remaining = Math.max(0, window.remaining - 1)
    if (window.remaining <= 0 && window.blockedUntil <= now) {
      window.blockedUntil = now + window.periodSeconds * 1000
    }
  }

  private computeDelay(state: BucketState): number {
    const now = Date.now()
    let delay = Math.max(0, state.hardBlockedUntil - now)
    for (const rule of state.rules) {
      for (const window of rule.windows) {
        if (window.remaining <= 0) {
          delay = Math.max(delay, window.blockedUntil - now)
        }
      }
    }
    return Math.max(0, delay)
  }

  private async waitAndReserve(bucket: string): Promise<void> {
    const state = this.getOrCreateBucket(bucket)
    const delay = this.computeDelay(state)
    if (delay > 0) await sleep(delay)

    const now = Date.now()
    for (const rule of state.rules) {
      for (const window of rule.windows) {
        this.decrementWindow(window, now)
      }
    }
  }

  private getOrCreateBucket(bucket: string): BucketState {
    let state = this.buckets.get(bucket)
    if (!state) {
      state = { rules: [], hardBlockedUntil: 0 }
      this.buckets.set(bucket, state)
    }
    return state
  }
}
