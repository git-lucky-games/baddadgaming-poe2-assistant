import { ipcMain } from 'electron'
import type { AppConfig, GggCharacter, SlotUpgrades } from '@shared/types'
import { configStore } from '../services/ConfigStore'
import { gggApiClient, gearUpgradeOrchestrator } from '../bootstrap'

export function registerIpcHandlers(): void {
  ipcMain.handle('config:get', (): AppConfig => configStore.store)

  ipcMain.handle('config:set', (_event, partial: Partial<AppConfig>): AppConfig => {
    configStore.set(partial)
    return configStore.store
  })

  ipcMain.handle('ggg:getCharacters', (): Promise<GggCharacter[]> => {
    const { accountName } = configStore.store
    return gggApiClient.getCharacters(accountName)
  })

  ipcMain.handle('gear-upgrade:scan', (_event, character: string): Promise<SlotUpgrades[]> => {
    const { accountName, league } = configStore.store
    return gearUpgradeOrchestrator.scanCharacter(accountName, character, league)
  })
}
