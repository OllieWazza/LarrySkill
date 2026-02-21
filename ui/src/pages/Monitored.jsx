import { useEffect, useState } from 'react'
import { Eye, Plus, X, RefreshCw, Heart, Repeat2 } from 'lucide-react'

export default function Monitored() {
  const [accounts, setAccounts] = useState([])
  const [newHandle, setNewHandle] = useState('')
  const [adding, setAdding] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/monitored')
      .then(r => r.json())
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addAccount = async () => {
    const h = newHandle.replace('@', '').trim()
    if (!h) return
    setAdding(true)
    try {
      const res = await fetch('/api/monitored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: h, action: 'add' })
      })
      const d = await res.json()
      setAccounts(d.accounts || [])
      setNewHandle('')
    } catch {}
    setAdding(false)
  }

  const removeAccount = async (handle) => {
    try {
      const res = await fetch('/api/monitored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, action: 'remove' })
      })
      const d = await res.json()
      setAccounts(d.accounts || [])
    } catch {}
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/monitored/refresh')
      const d = await res.json()
      setAccounts(d.accounts || [])
    } catch {}
    setRefreshing(false)
  }

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Eye className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            Monitored Accounts
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Track top creators in your niche and see their latest tweets
          </p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-[12px] hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ color: 'var(--color-primary)' }}>
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* Add handle */}
      <div className="card p-4">
        <p className="text-[12px] font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>Add account to monitor</p>
        <div className="flex gap-2">
          <input
            value={newHandle}
            onChange={e => setNewHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAccount()}
            placeholder="@handle"
            className="flex-1 px-3 py-2.5 rounded-lg text-[13px] border"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text)' }}
          />
          <button onClick={addAccount} disabled={adding || !newHandle.trim()}
            className="px-4 py-2.5 text-[13px] rounded-lg disabled:opacity-40 font-medium flex items-center gap-1.5 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity">
            {adding
              ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
      </div>

      {/* Accounts list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 rounded-full w-24" style={{ background: 'var(--color-border-subtle)' }} />
              <div className="h-3 rounded-full w-3/4" style={{ background: 'var(--color-border-subtle)' }} />
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="space-y-4">
          {accounts.map((acc, ai) => (
            <div key={ai} className="card p-5">
              {/* Account header */}
              <div className="flex items-center justify-between mb-3">
                <a href={`https://x.com/${acc.handle}`} target="_blank" rel="noopener"
                  className="text-[14px] font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-primary)' }}>
                  @{acc.handle}
                </a>
                <button onClick={() => removeAccount(acc.handle)}
                  className="hover:opacity-70 transition-opacity text-danger">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tweets */}
              {acc.tweets?.length > 0 ? (
                <div className="space-y-2">
                  {acc.tweets.slice(0, 3).map((t, ti) => (
                    <div key={ti} className="p-3 rounded-lg"
                      style={{ background: 'var(--color-bg-secondary)' }}>
                      <p className="text-[13px] line-clamp-2 mb-2">{t.text}</p>
                      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {t.impressions?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {t.likes?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat2 className="w-3 h-3" /> {t.retweets?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] italic" style={{ color: 'var(--color-text-muted)' }}>
                  No tweets cached — hit Refresh All
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <Eye className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-[14px] font-medium mb-1">No accounts monitored yet</p>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Add @handles above to track what's working in your niche
          </p>
        </div>
      )}
    </div>
  )
}
