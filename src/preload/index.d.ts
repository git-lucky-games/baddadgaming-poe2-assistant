import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppConfig, GggCharacter, SlotUpgrades, DivineRate } from '@shared/types'

interface Api {
  config: {
    get: () => Promise<AppConfig>
    set: (partial: Partial<AppConfig>) => Promise<AppConfig>
  }
  ggg: {
    getCharacters: () => Promise<GggCharacter[]>
  }
  gearUpgrade: {
    scan: (character: string) => Promise<SlotUpgrades[]>
  }
  ninja: {
    getDivineRate: () => Promise<DivineRate>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
