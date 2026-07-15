import { ipcMain } from 'electron'
import type { AppConfig } from '@shared/types'
import { configStore } from '../services/ConfigStore'

export function registerIpcHandlers(): void {
  ipcMain.handle('config:get', (): AppConfig => configStore.store)

  ipcMain.handle('config:set', (_event, partial: Partial<AppConfig>): AppConfig => {
    configStore.set(partial)
    return configStore.store
  })
}
