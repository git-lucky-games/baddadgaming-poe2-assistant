import { useState } from 'react'
import type { RankedUpgrade, SlotUpgrades } from '@shared/types'
import { SLOT_CONFIG } from '../lib/gearSlots'
import UpgradeResultCard from './UpgradeResultCard'

function pickBest(upgrades: RankedUpgrade[]): RankedUpgrade | undefined {
  return upgrades.find((u) => u.isBestValue) ?? upgrades[0]
}

interface Props {
  slotUpgrades: SlotUpgrades
}

function GearSlotCard({ slotUpgrades }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const { currentItem, upgrades } = slotUpgrades
  const config = SLOT_CONFIG[slotUpgrades.slot]
  const best = pickBest(upgrades)
  const rest = best ? upgrades.filter((u) => u.item.id !== best.item.id) : []

  return (
    <div className={`${config.areaClass} rounded-lg border border-gold/15 bg-black/20 p-3`}>
      <p className="text-xs font-semibold tracking-wide text-gold/50 uppercase">{config.label}</p>
      <p className="truncate text-sm text-gold">{currentItem.name || currentItem.typeLine}</p>

      {upgrades.length === 0 ? (
        <p className="mt-2 text-xs text-gold/40">No upgrades found right now</p>
      ) : (
        <div className="mt-2">
          {best && <UpgradeResultCard upgrade={best} />}
          {rest.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs font-medium text-gold/60 hover:text-gold"
            >
              {expanded ? 'Show less' : `+${rest.length} more option${rest.length > 1 ? 's' : ''}`}
            </button>
          )}
          {expanded && (
            <div className="mt-2 flex flex-col gap-2">
              {rest.map((u) => (
                <UpgradeResultCard key={u.item.id} upgrade={u} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GearSlotCard
