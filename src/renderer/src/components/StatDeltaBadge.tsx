import type { StatDelta } from '@shared/types'

function formatModLabel(modText: string): string {
  return modText.replace(/^[+-]?\d+(?:\.\d+)?\s*/, '')
}

function formatDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

interface Props {
  delta: StatDelta
}

function StatDeltaBadge({ delta }: Props): React.JSX.Element {
  const isPositive = delta.delta > 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs tabular-nums ${
        isPositive ? 'bg-tier-great/20 text-tier-great' : 'bg-gold/10 text-gold/70'
      }`}
    >
      <span className="font-semibold">{formatDelta(delta.delta)}</span>
      <span className="text-gold/60">{formatModLabel(delta.modText)}</span>
    </span>
  )
}

export default StatDeltaBadge
