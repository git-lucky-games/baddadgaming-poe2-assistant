import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import type { AppConfig, CurrencyHoldings } from '@shared/types'

const LEAGUE_SUGGESTIONS = ['Standard', 'Hardcore', 'Standard SSF', 'Hardcore SSF']

const emptyForm: AppConfig = {
  poesessid: '',
  accountName: '',
  league: 'Standard',
  currencyHoldings: { divine: 0, exalted: 0, chaos: 0 }
}

function SettingsPage(): React.JSX.Element {
  // App.tsx loads config app-wide on mount — no need to re-fetch here too.
  const { config, loading, saving, saveConfig } = useAppStore()
  const [form, setForm] = useState<AppConfig>(emptyForm)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (config) setForm(config)
  }, [config])

  function handleChange(field: keyof Omit<AppConfig, 'currencyHoldings'>, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCurrencyChange(currency: keyof CurrencyHoldings, value: string): void {
    const parsed = Math.max(0, Number(value) || 0)
    setForm((prev) => ({ ...prev, currencyHoldings: { ...prev.currencyHoldings, [currency]: parsed } }))
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

        <div className="flex flex-col gap-2 rounded border border-gold/15 bg-black/20 p-3">
          <span className="text-sm font-medium text-gold">Currency you have</span>
          <p className="text-xs text-gold/50">
            Optional — lets upgrades show whether you can actually afford them. Leave at 0 to skip. POE2 doesn't expose
            stash contents to any tool, so this has to be entered by hand.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gold/60">Divine</span>
              <input
                type="number"
                min={0}
                className="rounded border border-gold/30 bg-black/30 px-2 py-1.5 text-gold focus:border-gold focus:outline-none"
                value={form.currencyHoldings.divine}
                onChange={(e) => handleCurrencyChange('divine', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gold/60">Exalted</span>
              <input
                type="number"
                min={0}
                className="rounded border border-gold/30 bg-black/30 px-2 py-1.5 text-gold focus:border-gold focus:outline-none"
                value={form.currencyHoldings.exalted}
                onChange={(e) => handleCurrencyChange('exalted', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gold/60">Chaos</span>
              <input
                type="number"
                min={0}
                className="rounded border border-gold/30 bg-black/30 px-2 py-1.5 text-gold focus:border-gold focus:outline-none"
                value={form.currencyHoldings.chaos}
                onChange={(e) => handleCurrencyChange('chaos', e.target.value)}
              />
            </label>
          </div>
        </div>

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
