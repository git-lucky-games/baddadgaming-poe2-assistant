import type { PriceTier } from '@shared/types'

const TIER_LABELS: Record<PriceTier, string> = {
  'great-deal': 'Great Deal',
  'cheap-enough': 'Cheap Enough',
  'market-value': 'Market Value',
  'higher-than-normal': 'Higher Than Normal'
}

const TIER_COLORS: Record<PriceTier, string> = {
  'great-deal': 'bg-tier-great',
  'cheap-enough': 'bg-tier-cheap',
  'market-value': 'bg-tier-market',
  'higher-than-normal': 'bg-tier-high'
}

interface Props {
  tier: PriceTier
}

function PriceTierBadge({ tier }: Props): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-charcoal ${TIER_COLORS[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}

export default PriceTierBadge
