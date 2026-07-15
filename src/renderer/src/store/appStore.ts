import { create } from 'zustand'
import type { AppConfig } from '@shared/types'

interface AppState {
  config: AppConfig | null
  loading: boolean
  saving: boolean
  loadConfig: () => Promise<void>
  saveConfig: (partial: Partial<AppConfig>) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  loading: false,
  saving: false,
  loadConfig: async () => {
    set({ loading: true })
    const config = await window.api.config.get()
    set({ config, loading: false })
  },
  saveConfig: async (partial) => {
    set({ saving: true })
    const config = await window.api.config.set(partial)
    set({ config, saving: false })
  }
}))
