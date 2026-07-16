import SettingsPage from './pages/SettingsPage'

function App(): React.JSX.Element {
  return (
    <div className="h-screen overflow-y-auto bg-charcoal text-gold">
      <header className="border-b border-gold/20 px-8 py-4">
        <h1 className="text-xl font-bold tracking-wide">Bad Cuz Dad</h1>
        <p className="text-xs text-gold/50">POE2 Gaming Assistant</p>
      </header>
      <SettingsPage />
      <footer className="border-t border-gold/20 px-8 py-3 text-center text-xs text-gold/40">
        This product isn't affiliated with or endorsed by Grinding Gear Games in any way.
      </footer>
    </div>
  )
}

export default App
