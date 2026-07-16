import { create } from 'zustand'
import type { GggCharacter, SlotUpgrades } from '@shared/types'

type ScanStatus = 'idle' | 'scanning' | 'done' | 'error'

interface GearUpgradeState {
  characters: GggCharacter[] | null
  loadingCharacters: boolean
  charactersError: string | null

  selectedCharacter: string | null
  scanStatus: ScanStatus
  scanError: string | null
  slots: SlotUpgrades[] | null

  loadCharacters: () => Promise<void>
  selectCharacter: (name: string) => Promise<void>
  rescan: () => Promise<void>
}

export const useGearUpgradeStore = create<GearUpgradeState>((set, get) => ({
  characters: null,
  loadingCharacters: false,
  charactersError: null,

  selectedCharacter: null,
  scanStatus: 'idle',
  scanError: null,
  slots: null,

  loadCharacters: async () => {
    set({ loadingCharacters: true, charactersError: null })
    try {
      const characters = await window.api.ggg.getCharacters()
      set({ characters, loadingCharacters: false })
    } catch (err) {
      set({ loadingCharacters: false, charactersError: err instanceof Error ? err.message : String(err) })
    }
  },

  selectCharacter: async (name: string) => {
    set({ selectedCharacter: name })
    await get().rescan()
  },

  rescan: async () => {
    const character = get().selectedCharacter
    if (!character) return
    set({ scanStatus: 'scanning', scanError: null })
    try {
      const slots = await window.api.gearUpgrade.scan(character)
      set({ slots, scanStatus: 'done' })
    } catch (err) {
      set({ scanStatus: 'error', scanError: err instanceof Error ? err.message : String(err) })
    }
  }
}))
