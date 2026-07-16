import { create } from 'zustand'
import type { DivineRate } from '@shared/types'

interface StatusState {
  divineRate: DivineRate | null
  loadingDivineRate: boolean
  divineRateError: string | null
  loadDivineRate: () => Promise<void>
}

export const useStatusStore = create<StatusState>((set) => ({
  divineRate: null,
  loadingDivineRate: false,
  divineRateError: null,
  loadDivineRate: async () => {
    set({ loadingDivineRate: true, divineRateError: null })
    try {
      const divineRate = await window.api.ninja.getDivineRate()
      set({ divineRate, loadingDivineRate: false })
    } catch (err) {
      set({ loadingDivineRate: false, divineRateError: err instanceof Error ? err.message : String(err) })
    }
  }
}))
