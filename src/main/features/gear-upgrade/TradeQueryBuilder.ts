import statIdsData from '@data/stat-ids.json'
import type { TradeItem } from '@shared/types'

export type { TradeItem } from '@shared/types'

export type StatGroupId =
  | 'pseudo'
  | 'explicit'
  | 'implicit'
  | 'fractured'
  | 'crafted'
  | 'enchant'
  | 'rune'
  | 'desecrated'
  | 'sanctum'
  | 'skill'

interface StatEntry {
  id: string
  text: string
  type: string
}

interface StatGroup {
  id: string
  label: string
  entries: StatEntry[]
}

export interface ParsedModText {
  /** GGG's templated form, e.g. "# to maximum Life" or "Adds # to # Physical Damage". */
  template: string
  /** Numeric values pulled out in the order they appeared. */
  values: number[]
}

export interface StatFilter {
  id: string
  min?: number
  max?: number
}

export interface TradeSearchBody {
  query: {
    status: { option: 'online' | 'onlineleague' | 'any' }
    stats: [{ type: 'and'; filters: Array<{ id: string; value?: { min?: number; max?: number }; disabled?: boolean }> }]
    filters?: {
      type_filters?: { filters: { category?: { option: string } } }
    }
  }
  sort?: Record<string, 'asc' | 'desc'>
}

export interface TradeSearchOptions {
  status?: 'online' | 'onlineleague' | 'any'
  category?: string
  sort?: Record<string, 'asc' | 'desc'>
}

const NUMBER_PATTERN = /[+-]?\d+(?:\.\d+)?/g

/** Strips concrete numeric values from mod text and replaces them with GGG's "#" placeholder. */
export function parseModText(modText: string): ParsedModText {
  const values: number[] = []
  const template = modText.replace(NUMBER_PATTERN, (match) => {
    values.push(Number(match))
    return '#'
  })
  return { template, values }
}

const statsByGroup: Map<StatGroupId, Map<string, string>> = new Map(
  (statIdsData as { result: StatGroup[] }).result.map((group) => {
    const index = new Map<string, string>()
    for (const entry of group.entries) {
      if (!index.has(entry.text)) index.set(entry.text, entry.id)
    }
    return [group.id as StatGroupId, index]
  })
)

/** Resolves concrete item mod text (e.g. "+45 to maximum Life") to its trade API stat id. */
export function resolveStatId(modText: string, group: StatGroupId): string | undefined {
  const { template } = parseModText(modText)
  return statsByGroup.get(group)?.get(template)
}

export interface TradeSearchResponse {
  id: string
  complexity?: number
  result: string[]
  total: number
}

// GGG returns `null` for ids that sold between search and fetch — callers must filter these.
export interface TradeFetchResponse {
  result: (TradeItem | null)[]
}

export function buildSearchBody(filters: StatFilter[], options: TradeSearchOptions = {}): TradeSearchBody {
  return {
    query: {
      status: { option: options.status ?? 'online' },
      stats: [
        {
          type: 'and',
          filters: filters.map((filter) => ({
            id: filter.id,
            value: filter.min !== undefined || filter.max !== undefined ? { min: filter.min, max: filter.max } : undefined,
            disabled: false
          }))
        }
      ],
      ...(options.category
        ? { filters: { type_filters: { filters: { category: { option: options.category } } } } }
        : {})
    },
    ...(options.sort ? { sort: options.sort } : {})
  }
}
