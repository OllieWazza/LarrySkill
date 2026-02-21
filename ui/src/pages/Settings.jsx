import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff,
  RefreshCw, AlertTriangle, ExternalLink
} from 'lucide-react'

const TIMEZONES = [
  { label: 'London (UTC+0)',      value: 'Europe/London' },
  { label: 'Paris (UTC+1)',       value: 'Europe/Paris' },
  { label: 'New York (UTC-5)',    value: 'America/New_York' },
  { label: 'Chicago (UTC-6)',     value: 'America/Chicago' },
  { label: 'Los Angeles (UTC-8)', value: 'America/Los_Angeles' },
  { label: 'Sydney (UTC+10)',     value: 'Australia/Sydney' },
  { label: 'Tokyo (UTC+9)',       value: 'Asia/Tokyo' },
  { label: 'Dubai (UTC+4)',       value: 'Asia/Dubai' },
  { label: 'Singapore (UTC+8)',   value: 'Asia/Singapore' },
]

function ToggleSwitch({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0"
      style={{ background: on ? 'var(--color-primary)' : 'var(--color-border)' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

function StatusDot({ connected }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: connected ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
      {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {connected ? 'Connected' : 'Not connected'}
    </span>
  )
}

function mask(val) {
  if (!val) return '—'
  if (val.length <= 8) return '•'.repeat(val.length)
  return val.slice(0, 4) + '•'.repeat(Math.min(val.length - 8, 20)) + val.slice(-4)
}

export default function Settings() {
  const navigate = useNavigate()
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testingConn, setTestingConn] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [credsExpanded, setCredsExpanded] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Inline update states
  const [postizInput, setPostizInput] = useState('')
  const [postizEditing, setPostizEditing] = useState(false)
  const [openaiInput, setOpenaiInput] = useState('')
  const [openaiEditing, setOpenaiEditing] = useState(false)
  const [cookieEditing, setCookieEditing] = useState(false)
  const [authTokenInput, setAuthTokenInput] = useState('')
  const [ct0Input, setCt0Input] = useState('')
  const [cookieTestResult, setCookieTestResult] = useState(null)
  const [testingCookies, setTestingCookies] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setConfig(d.config || {}))
  }, [])

  const saveField = async (updates) => {
    setSaving(true)
    const next = { ...config, ...updates }
    setConfig(next)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const testConnection = async () => {
    setTestingConn(true)
    setTestResult(null)
    try {
      const r = await fetch('/api/twitter/verify')
      const d = await r.json()
      setTestResult(d.ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    }
    setTestingConn(false)
    setTimeout(() => setTestResult(null), 5000)
  }

  const saveAllCreds = async () => {
    const fields = ['bearerToken', 'apiKey', 'apiSecret', 'accessToken', 'accessSecret']
    const updates = {}
    fields.forEach(f => {
      const el = document.getElementById(`cred-${f}`)
      if (el) updates[f] = el.value
    })
    await saveField(updates)
    setCredsExpanded(false)
  }

  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 5000)
      return
    }
    setResetting(true)
    try {
      await fetch('/api/config/reset', { method: 'POST' })
    } catch {}
    navigate('/onboarding', { replace: true })
  }

  const testCookieAuth = async () => {
    setTestingCookies(true)
    setCookieTestResult(null)
    try {
      const r = await fetch('/api/test-cookie-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const d = await r.json()
      setCookieTestResult(d)
    } catch {
      setCookieTestResult({ success: false, error: 'Connection failed' })
    }
    setTestingCookies(false)
    setTimeout(() => setCookieTestResult(null), 8000)
  }

  const saveCookieAuth = async () => {
    await saveField({ authToken: authTokenInput, ct0: ct0Input })
    setCookieEditing(false)
    setAuthTokenInput('')
    setCt0Input('')
  }

  const twitterConnected = !!(config.bearerToken)
  const postizConnected = !!(config.postizKey)
  const openaiConnected = !!(config.openaiKey)
  const cookieConnected = !!(config.authToken)
  const username = config.username || config.twitterHandle || ''
  const displayName = config.displayName || config.name || ''

  return (
    <div className="p-8 w-full max-w-4xl space-y-6 animate-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Manage your connections, preferences and credentials
        </p>
      </div>

      {/* Account card */}
      <div className="card p-6 space-y-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Name</span>
            <span className="text-[14px] font-medium">{displayName || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Username</span>
            <span className="text-[14px] font-medium">{username ? `@${username}` : '—'}</span>
          </div>
        </div>
      </div>

      {/* Settings card */}
      <div className="card p-6 space-y-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Settings</h2>

        {/* Twitter/X connection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">Connect to Twitter/X</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Posts will be published with {username ? `@${username}` : 'your account'}
              </p>
            </div>
            <ToggleSwitch on={twitterConnected} onChange={() => {}} />
          </div>
          {twitterConnected && (
            <p className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: 'var(--color-success)' }}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected via Bearer Token
            </p>
          )}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

        {/* Timezone */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium">Timezone</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Used for scheduling your post queue</p>
          </div>
          <select
            value={config.timezone || 'Europe/London'}
            onChange={e => saveField({ timezone: e.target.value })}
            className="text-[13px] px-3 py-2 rounded-lg border appearance-none cursor-pointer"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
              minWidth: '180px',
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

        {/* Postiz connection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">Postiz Connection</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>For scheduled publishing via Postiz</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot connected={postizConnected} />
              <button
                onClick={() => setPostizEditing(v => !v)}
                className="text-[12px] px-3 py-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {postizEditing ? 'Cancel' : 'Update key'}
              </button>
            </div>
          </div>
          {postizEditing && (
            <div className="flex gap-2 mt-1">
              <input
                type="password"
                placeholder="Postiz API key…"
                value={postizInput}
                onChange={e => setPostizInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-[13px]"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                onClick={() => { saveField({ postizKey: postizInput }); setPostizEditing(false); setPostizInput('') }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

        {/* OpenAI connection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">OpenAI Connection</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>For AI post generation and suggestions</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot connected={openaiConnected} />
              <button
                onClick={() => setOpenaiEditing(v => !v)}
                className="text-[12px] px-3 py-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {openaiEditing ? 'Cancel' : 'Update key'}
              </button>
            </div>
          </div>
          {openaiEditing && (
            <div className="flex gap-2 mt-1">
              <input
                type="password"
                placeholder="sk-proj-…"
                value={openaiInput}
                onChange={e => setOpenaiInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border text-[13px]"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                onClick={() => { saveField({ openaiKey: openaiInput }); setOpenaiEditing(false); setOpenaiInput('') }}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="border-t" style={{ borderColor: 'var(--color-border-subtle)' }} />

        {/* Cookie Auth for Real Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">X Cookie Auth <span className="text-[10px] font-normal px-1.5 py-0.5 rounded ml-1.5" style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}>Real Metrics</span></p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Unlocks real impression counts via non_public_metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot connected={cookieConnected} />
              <button
                onClick={() => setCookieEditing(v => !v)}
                className="text-[12px] px-3 py-1.5 rounded-lg border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {cookieEditing ? 'Cancel' : 'Configure'}
              </button>
            </div>
          </div>
          {cookieEditing && (
            <div className="mt-2 space-y-3">
              <div className="p-3 rounded-lg text-[12px] leading-relaxed space-y-1.5" style={{ background: 'oklch(0.65 0.19 250 / 0.06)', border: '1px solid oklch(0.65 0.19 250 / 0.15)' }}>
                <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>How to get your cookies:</p>
                <ol className="list-decimal ml-4 space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <li>Sign in to <a href="https://x.com" target="_blank" rel="noopener" className="underline" style={{ color: 'var(--color-primary)' }}>x.com</a> in your browser</li>
                  <li>Open DevTools (F12) → Application → Cookies → x.com</li>
                  <li>Copy the values for <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-secondary)' }}>auth_token</code> and <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--color-bg-secondary)' }}>ct0</code></li>
                </ol>
                <p className="flex items-center gap-1.5 mt-2 font-medium" style={{ color: 'var(--color-success)' }}>
                  🔒 These stay on your machine. Xcellent never sends them anywhere.
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>auth_token</label>
                <input
                  type="password"
                  placeholder="Paste auth_token cookie…"
                  value={authTokenInput}
                  onChange={e => setAuthTokenInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono"
                  style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>ct0</label>
                <input
                  type="password"
                  placeholder="Paste ct0 cookie…"
                  value={ct0Input}
                  onChange={e => setCt0Input(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono"
                  style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={saveCookieAuth}
                  disabled={!authTokenInput || !ct0Input}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Save Cookies
                </button>
                {cookieConnected && (
                  <button
                    onClick={testCookieAuth}
                    disabled={testingCookies}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[13px] font-medium disabled:opacity-40 hover:bg-white/5 transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingCookies ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                )}
              </div>
              {cookieTestResult && (
                <div className="flex items-center gap-2 text-[12px] font-medium"
                  style={{ color: cookieTestResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {cookieTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {cookieTestResult.message || cookieTestResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* API Credentials card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            API Credentials
          </h2>
          <button
            onClick={() => setShowTokens(v => !v)}
            className="flex items-center gap-1.5 text-[12px] hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {showTokens ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTokens ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Masked display */}
        <div className="space-y-2.5">
          {[
            { key: 'bearerToken',   label: 'Bearer Token' },
            { key: 'apiKey',        label: 'API Key' },
            { key: 'apiSecret',     label: 'API Secret' },
            { key: 'accessToken',   label: 'Access Token' },
            { key: 'accessSecret',  label: 'Access Token Secret' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1.5">
              <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              <span className="text-[12px] font-mono" style={{ color: config[key] ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                {showTokens ? (config[key] || '—') : mask(config[key])}
              </span>
            </div>
          ))}
        </div>

        {/* Update credentials */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <button
            onClick={() => setCredsExpanded(v => !v)}
            className="flex items-center gap-2 text-[13px] font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            {credsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {credsExpanded ? 'Hide form' : 'Update credentials'}
          </button>

          {credsExpanded && (
            <div className="mt-4 space-y-3">
              {[
                { key: 'bearerToken',   label: 'Bearer Token' },
                { key: 'apiKey',        label: 'API Key' },
                { key: 'apiSecret',     label: 'API Secret' },
                { key: 'accessToken',   label: 'Access Token' },
                { key: 'accessSecret',  label: 'Access Token Secret' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
                  <input
                    id={`cred-${key}`}
                    type="password"
                    defaultValue={config[key] || ''}
                    placeholder="•••••••••••••"
                    className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono"
                    style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveAllCreds}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save credentials'}
                </button>
                <button
                  onClick={testConnection}
                  disabled={testingConn}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border text-[13px] font-medium disabled:opacity-40 hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
                {testResult && (
                  <span className="flex items-center gap-1 text-[12px] font-medium"
                    style={{ color: testResult === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {testResult === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {testResult === 'success' ? 'Connected!' : 'Failed'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 space-y-3" style={{ borderColor: 'oklch(0.65 0.2 25 / 0.35)' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-danger)' }}>
            Danger Zone
          </h2>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          Permanently delete all config, cache and history. You'll be taken back to onboarding.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-semibold transition-colors disabled:opacity-40"
          style={{
            borderColor: resetConfirm ? 'var(--color-danger)' : 'oklch(0.65 0.2 25 / 0.4)',
            color: 'var(--color-danger)',
            background: resetConfirm ? 'oklch(0.65 0.2 25 / 0.1)' : 'transparent',
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          {resetting ? 'Resetting…' : resetConfirm ? '⚠️ Click again to confirm' : 'Reset Everything'}
        </button>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-between pb-4 text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        <a
          href="https://github.com/oliverhenry/xcellent/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-primary)' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Support &amp; Feedback
        </a>
        <span>Xcellent v1.0.0 — Free &amp; Open Source</span>
      </div>

      {/* SuperX upsell */}
      <div className="card p-4 mt-4 flex items-center justify-between"
        style={{ background: 'oklch(0.65 0.19 250 / 0.04)', border: '1px solid var(--color-border-subtle)' }}>
        <div>
          <p className="text-[13px] font-semibold">Want Auto Retweet, Scheduling &amp; more?</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Features like Auto Retweet, Auto Delete, post scheduling, and cross-posting are available with SuperX.
          </p>
        </div>
        <a
          href="https://superx.so/?via=oliver"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--color-primary)' }}
        >
          Try SuperX →
        </a>
      </div>
    </div>
  )
}
