import Store from 'electron-store'
import type { AppConfig } from '@shared/types'

const defaults: AppConfig = {
  poesessid: '',
  accountName: '',
  league: 'Standard'
}

// electron-store's encryptionKey only obfuscates the config file against casual
// inspection (the key ships in the app binary) — it is not real secret storage.
export const configStore = new Store<AppConfig>({
  name: 'bad-cuz-dad-config',
  defaults,
  encryptionKey: 'bad-cuz-dad-local-config-v1'
})
