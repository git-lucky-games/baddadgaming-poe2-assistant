import type { RankedUpgrade } from '@shared/types'
import PriceTierBadge from './PriceTierBadge'
import StatDeltaBadge from './StatDeltaBadge'

function formatPrice(upgrade: RankedUpgrade): string {
  const price = upgrade.item.listing.price
  if (!price) return `~${upgrade.priceInDivine.toFixed(2)} divine`
  const primary = `${price.amount} ${price.currency}`
  if (price.currency === 'divine') return primary
  return `${primary} (~${upgrade.priceInDivine.toFixed(2)} divine)`
}

interface Props {
  upgrade: RankedUpgrade
}

function UpgradeResultCard({ upgrade }: Props): React.JSX.Element {
  const { item } = upgrade

  async function copyWhisper(): Promise<void> {
    if (item.listing.whisper) await navigator.clipboard.writeText(item.listing.whisper)
  }

  return (
    <div
      className={`rounded-lg border p-3 ${
        upgrade.affordable === false ? 'border-gold/10 opacity-60' : 'border-gold/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gold">{item.item.name || item.item.typeLine}</p>
          <p className="tabular-nums text-sm text-gold/70">{formatPrice(upgrade)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <PriceTierBadge tier={upgrade.priceTier} />
          {upgrade.isBestValue && <span className="text-value-accent text-xs font-semibold">★ Best Value</span>}
        </div>
      </div>

      {upgrade.statDeltas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {upgrade.statDeltas.map((delta, i) => (
            <StatDeltaBadge key={i} delta={delta} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gold/50">
          {upgrade.affordable === false ? 'Over your budget' : upgrade.affordable === true ? 'You can afford this' : ''}
        </span>
        {item.listing.whisper && (
          <button
            onClick={copyWhisper}
            className="shrink-0 rounded bg-crimson/80 px-2.5 py-1 text-xs font-semibold text-gold hover:bg-crimson"
          >
            Copy whisper
          </button>
        )}
      </div>
    </div>
  )
}

export default UpgradeResultCard
