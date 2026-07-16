import { ipcMain } from 'electron'
import type { AppConfig, GggCharacter, SlotUpgrades, DivineRate } from '@shared/types'
import { configStore } from '../services/ConfigStore'
import { gggApiClient, gearUpgradeOrchestrator, poeNinjaClient } from '../bootstrap'
import { friendlyErrorMessage } from '../services/errorMessages'

function requireAccountConfigured(): { accountName: string; poesessid: string } {
  const { accountName, poesessid } = configStore.store
  if (!poesessid || !accountName) {
    throw new Error('Set your POESESSID and account name in Settings first.')
  }
  return { accountName, poesessid }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('config:get', (): AppConfig => configStore.store)

  ipcMain.handle('config:set', (_event, partial: Partial<AppConfig>): AppConfig => {
    configStore.set(partial)
    return configStore.store
  })

  ipcMain.handle('ggg:getCharacters', async (): Promise<GggCharacter[]> => {
    const { accountName } = requireAccountConfigured()
    try {
      return await gggApiClient.getCharacters(accountName)
    } catch (err) {
      throw new Error(friendlyErrorMessage(err, 'pathofexile.com'))
    }
  })

  ipcMain.handle('gear-upgrade:scan', async (_event, character: string): Promise<SlotUpgrades[]> => {
    const { accountName } = requireAccountConfigured()
    const { league, currencyHoldings, priorityStats } = configStore.store
    try {
      return await gearUpgradeOrchestrator.scanCharacter(accountName, character, league, currencyHoldings, priorityStats)
    } catch (err) {
      throw new Error(friendlyErrorMessage(err, 'pathofexile.com or the trade site'))
    }
  })

  ipcMain.handle('ninja:getDivineRate', async (): Promise<DivineRate> => {
    const { league } = configStore.store
    try {
      return await poeNinjaClient.getDivineRate(league)
    } catch (err) {
      throw new Error(friendlyErrorMessage(err, 'poe.ninja'))
    }
  })
}
