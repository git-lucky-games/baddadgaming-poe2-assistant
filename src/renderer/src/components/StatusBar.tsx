import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useGearUpgradeStore } from '../store/gearUpgradeStore'
import { useStatusStore } from '../store/statusStore'

function StatusBar(): React.JSX.Element {
  const config = useAppStore((s) => s.config)
  const { divineRate, loadDivineRate } = useStatusStore()
  const { characters, loadingCharacters, charactersError } = useGearUpgradeStore()

  useEffect(() => {
    loadDivineRate()
  }, [loadDivineRate])

  const connectionLabel = charactersError
    ? 'Connection issue — check Settings'
    : loadingCharacters
      ? 'Connecting…'
      : characters
        ? 'Connected'
        : 'Not connected yet'
  const connectionColor = charactersError ? 'bg-tier-high' : characters ? 'bg-tier-great' : 'bg-gold/30'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gold/10 bg-black/20 px-8 py-1.5 text-xs text-gold/60">
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${connectionColor}`} />
        {connectionLabel}
      </span>
      {config?.league && <span>League: {config.league}</span>}
      {divineRate && (
        <span className="tabular-nums">
          1 Divine ≈ {Math.round(divineRate.rates.exalted ?? 0)} Exalted · {Math.round(divineRate.rates.chaos ?? 0)} Chaos
        </span>
      )}
    </div>
  )
}

export default StatusBar
