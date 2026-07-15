import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { AppConfig } from '@shared/types'

const LEAGUE_SUGGESTIONS = ['Standard', 'Hardcore', 'Standard SSF', 'Hardcore SSF']

const emptyForm: AppConfig = {
  poesessid: '',
  accountName: '',
  league: 'Standard'
}

function SettingsPage(): React.JSX.Element {
  const { config, loading, saving, loadConfig, saveConfig } = useAppStore()
  const [form, setForm] = useState<AppConfig>(emptyForm)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  function handleChange(field: keyof AppConfig, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    await saveConfig(form)
    setSavedAt(Date.now())
  }

  if (loading) {
    return <div className="p-8 text-gold/70">Loading settings…</div>
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="mb-1 text-2xl font-bold text-gold">Settings</h1>
      <p className="mb-6 text-sm text-gold/60">
        Stored locally on this machine. Nothing here is sent anywhere except the APIs each field is for.
      </p>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gold">POESESSID</span>
          <input
            type="password"
            autoComplete="off"
            className="rounded border border-gold/30 bg-black/30 px-3 py-2 text-gold placeholder:text-gold/30 focus:border-gold focus:outline-none"
            placeholder="Session cookie from pathofexile.com"
            value={form.poesessid}
            onChange={(e) => handleChange('poesessid', e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gold">Account Name</span>
          <input
            type="text"
            className="rounded border border-gold/30 bg-black/30 px-3 py-2 text-gold placeholder:text-gold/30 focus:border-gold focus:outline-none"
            placeholder="YourAccount#1234"
            value={form.accountName}
            onChange={(e) => handleChange('accountName', e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gold">League</span>
          <input
            type="text"
            list="league-suggestions"
            className="rounded border border-gold/30 bg-black/30 px-3 py-2 text-gold placeholder:text-gold/30 focus:border-gold focus:outline-none"
            value={form.league}
            onChange={(e) => handleChange('league', e.target.value)}
          />
          <datalist id="league-suggestions">
            {LEAGUE_SUGGESTIONS.map((league) => (
              <option key={league} value={league} />
            ))}
          </datalist>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-crimson px-4 py-2 font-semibold text-gold transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {savedAt && !saving && <span className="text-sm text-gold/60">Saved</span>}
        </div>
      </form>
    </div>
  )
}

export default SettingsPage
