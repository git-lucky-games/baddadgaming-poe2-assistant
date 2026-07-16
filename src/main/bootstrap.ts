import { request } from './services/HttpClient'
import { RateLimiter } from './services/RateLimiter'
import { TradeApiClient } from './services/TradeApiClient'
import { PoeNinjaClient } from './services/PoeNinjaClient'
import { GggApiClient } from './services/GggApiClient'
import { SqliteTradeCache } from './cache/TradeCache'
import { SqliteNinjaCache } from './cache/NinjaCache'
import { GearUpgradeOrchestrator } from './features/gear-upgrade/GearUpgradeOrchestrator'
import { configStore } from './services/ConfigStore'

// Single RateLimiter shared across clients — each uses its own bucket keys
// (trade-search, trade-fetch, ggg-character, ggg-stash) so there's no
// cross-talk, and sharing one instance keeps this simple.
const rateLimiter = new RateLimiter()
const getPoesessid = (): string => configStore.store.poesessid

const tradeApiClient = new TradeApiClient(rateLimiter, new SqliteTradeCache(), getPoesessid, request)
const poeNinjaClient = new PoeNinjaClient(request, new SqliteNinjaCache())
const gggApiClient = new GggApiClient(rateLimiter, getPoesessid, request)

export const gearUpgradeOrchestrator = new GearUpgradeOrchestrator(gggApiClient, tradeApiClient, poeNinjaClient)
export { gggApiClient, poeNinjaClient }
