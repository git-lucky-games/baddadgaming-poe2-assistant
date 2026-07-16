import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppConfig, GggCharacter, SlotUpgrades } from '@shared/types'

const api = {
  config: {
    get: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
    set: (partial: Partial<AppConfig>): Promise<AppConfig> => ipcRenderer.invoke('config:set', partial)
  },
  ggg: {
    getCharacters: (): Promise<GggCharacter[]> => ipcRenderer.invoke('ggg:getCharacters')
  },
  gearUpgrade: {
    scan: (character: string): Promise<SlotUpgrades[]> => ipcRenderer.invoke('gear-upgrade:scan', character)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
