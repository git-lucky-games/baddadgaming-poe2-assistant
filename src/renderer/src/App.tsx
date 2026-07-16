import { useState } from 'react'
import SettingsPage from './pages/SettingsPage'
import GearUpgradePage from './pages/GearUpgradePage'

type Page = 'gear-upgrade' | 'settings'

function App(): React.JSX.Element {
  const [page, setPage] = useState<Page>('gear-upgrade')

  return (
    <div className="h-screen overflow-y-auto bg-charcoal text-gold">
      <header className="flex items-center justify-between border-b border-gold/20 px-8 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-wide">Bad Cuz Dad</h1>
          <p className="text-xs text-gold/50">POE2 Gaming Assistant</p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-black/20 p-1">
          <button
            onClick={() => setPage('gear-upgrade')}
            className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
              page === 'gear-upgrade' ? 'bg-crimson text-gold' : 'text-gold/60 hover:text-gold'
            }`}
          >
            Gear Upgrades
          </button>
          <button
            onClick={() => setPage('settings')}
            className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
              page === 'settings' ? 'bg-crimson text-gold' : 'text-gold/60 hover:text-gold'
            }`}
          >
            Settings
          </button>
        </nav>
      </header>

      {page === 'gear-upgrade' ? <GearUpgradePage /> : <SettingsPage />}

      <footer className="border-t border-gold/20 px-8 py-3 text-center text-xs text-gold/40">
        This product isn't affiliated with or endorsed by Grinding Gear Games in any way.
      </footer>
    </div>
  )
}

export default App
