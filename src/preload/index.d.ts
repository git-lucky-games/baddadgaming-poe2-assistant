import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppConfig, GggCharacter, SlotUpgrades } from '@shared/types'

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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
