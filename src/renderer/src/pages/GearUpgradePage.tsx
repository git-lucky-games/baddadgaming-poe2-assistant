import { useEffect } from 'react'
import { useGearUpgradeStore } from '../store/gearUpgradeStore'
import GearSlotCard from '../components/GearSlotCard'
import { SLOT_CONFIG } from '../lib/gearSlots'

function GearUpgradePage(): React.JSX.Element {
  const {
    characters,
    loadingCharacters,
    charactersError,
    loadCharacters,
    selectedCharacter,
    selectCharacter,
    scanStatus,
    scanError,
    slots,
    rescan
  } = useGearUpgradeStore()

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const paperdollSlots = slots?.filter((s) => SLOT_CONFIG[s.slot]) ?? []

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold">Gear Upgrades</h1>
          <p className="text-sm text-gold/60">Pick a character — upgrades show up automatically.</p>
        </div>
        {selectedCharacter && (
          <button
            onClick={rescan}
            disabled={scanStatus === 'scanning'}
            className="shrink-0 rounded bg-crimson px-3 py-1.5 text-sm font-semibold text-gold transition hover:brightness-110 disabled:opacity-50"
          >
            {scanStatus === 'scanning' ? 'Scanning…' : 'Rescan'}
          </button>
        )}
      </div>

      {loadingCharacters && <p className="text-gold/60">Loading characters…</p>}
      {charactersError && (
        <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-sm text-gold">
          Couldn't load characters: {charactersError}. Check your POESESSID and account name in Settings.
        </p>
      )}

      {characters && characters.length > 0 && (
        <select
          className="mb-6 rounded border border-gold/30 bg-black/30 px-3 py-2 text-gold focus:border-gold focus:outline-none"
          value={selectedCharacter ?? ''}
          onChange={(e) => selectCharacter(e.target.value)}
        >
          <option value="" disabled>
            Choose a character…
          </option>
          {characters.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} (Lv {c.level} {c.class})
            </option>
          ))}
        </select>
      )}

      {characters && characters.length === 0 && !loadingCharacters && (
        <p className="text-gold/60">No characters found on this account.</p>
      )}

      {scanStatus === 'scanning' && <p className="text-gold/60">Scanning your gear for upgrades…</p>}
      {scanStatus === 'error' && (
        <p className="rounded border border-crimson/40 bg-crimson/10 p-3 text-sm text-gold">Scan failed: {scanError}</p>
      )}

      {paperdollSlots.length > 0 && (
        <div className="paperdoll relative">
          {paperdollSlots.map((slotUpgrades) => (
            <GearSlotCard key={slotUpgrades.slot} slotUpgrades={slotUpgrades} />
          ))}
        </div>
      )}
    </div>
  )
}

export default GearUpgradePage
