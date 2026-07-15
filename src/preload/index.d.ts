import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppConfig } from '@shared/types'

interface Api {
  config: {
    get: () => Promise<AppConfig>
    set: (partial: Partial<AppConfig>) => Promise<AppConfig>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
