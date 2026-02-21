import { useEffect, useState } from 'react'
import { TrendingUp, Hash, RefreshCw, ExternalLink, Flame } from 'lucide-react'

function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function Trends() {
  const [trends, setTrends] = useState([])
  const [nicheTrends, setNicheTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [nicheLoading, setNicheLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nicheRefreshing, setNicheRefreshing] = useState(false)
  const [woeid, setWoeid] = useState('UK')

  const loadGlobal = async (spin = false) => {
    if (spin) setRefreshing(true)
    try {
      const res = await fetch('/api/trends')
      const d = await res.json()
      setTrends(d.trends || [])
      if (d.location) setWoeid(d.location)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }

  const loadNiche = async (spin = false) => {
    if (spin) setNicheRefreshing(true)
    try {
      const res = await fetch('/api/trends/niche')
      const d = await res.json()
      setNicheTrends(d.nicheTrends || [])
    } catch {}
    setNicheLoading(false)
    setNicheRefreshing(false)
  }

  useEffect(() => {
    loadGlobal()
    loadNiche()
  }, [])

  return (
    <div className="p-6 space-y-6 w-full">
      {/* ── Section 1: Trending Globally ── */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              Trending Globally
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              What's trending on X right now · {woeid} · Change WOEID in Settings
            </p>
          </div>
          <button onClick={() => loadGlobal(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-[12px] hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="card divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-5 h-2.5 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="h-3 rounded-full flex-1" style={{ background: 'var(--color-border-subtle)', maxWidth: '200px' }} />
              </div>
            ))}
          </div>
        ) : trends.length > 0 ? (
          <div className="card divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {trends.map((t, i) => (
              <a key={i}
                href={`https://x.com/search?q=${encodeURIComponent(t.name)}`}
                target="_blank" rel="noopener"
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)] group">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono w-5 text-right" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <span className="text-[13px] font-medium">{t.name}</span>
                    </div>
                    {t.category && (
                      <p className="text-[10px] mt-0.5 ml-5" style={{ color: 'var(--color-text-muted)' }}>{t.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {t.tweet_count != null && (
                    <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {t.tweet_count >= 1000 ? (t.tweet_count / 1000).toFixed(1) + 'K' : t.tweet_count}
                    </span>
                  )}
                  <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-[14px] font-medium mb-1">Trends unavailable</p>
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              Requires Twitter v1.1 API credentials. Check your Settings.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 2: Trending in Your Niche ── */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              Trending in Your Niche
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Popular topics and tweets from your interest areas
            </p>
          </div>
          <button onClick={() => loadNiche(true)} disabled={nicheRefreshing}
            className="flex items-center gap-1.5 text-[12px] hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${nicheRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {nicheLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="h-3 w-24 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-2.5 rounded-full" style={{ background: 'var(--color-border-subtle)', width: `${60 + j * 10}%` }} />
                    <div className="h-2 rounded-full w-20" style={{ background: 'var(--color-border-subtle)' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : nicheTrends.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {nicheTrends.map((niche, ni) => (
              <div key={ni} className="card p-4">
                {/* Topic header */}
                <div className="mb-3">
                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'oklch(0.65 0.18 300 / 0.12)', color: 'var(--color-accent)' }}>
                    {niche.topic}
                  </span>
                </div>

                {/* Related hashtags */}
                {niche.relatedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {niche.relatedHashtags.map((tag, ti) => (
                      <a key={ti}
                        href={`https://x.com/search?q=${encodeURIComponent(tag)}`}
                        target="_blank" rel="noopener"
                        className="text-[10px] px-1.5 py-0.5 rounded-full border hover:opacity-80 transition-opacity"
                        style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-primary)' }}>
                        {tag}
                      </a>
                    ))}
                  </div>
                )}

                {/* Top tweets */}
                <div className="space-y-2">
                  {niche.tweets.map((tweet, ti) => (
                    <div key={ti} className="p-2.5 rounded-lg text-[11px]"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                      <p className="line-clamp-3 mb-1.5">{tweet.text}</p>
                      <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <a href={`https://x.com/${tweet.author.username}`} target="_blank" rel="noopener"
                          className="font-medium hover:opacity-80 truncate"
                          style={{ color: 'var(--color-primary)' }}>
                          @{tweet.author.username}
                        </a>
                        <span className="ml-auto shrink-0">❤️ {fmtNum(tweet.likes)}</span>
                        {tweet.impressions > 0 && (
                          <span className="shrink-0">👁 {fmtNum(tweet.impressions)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <Flame className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-[14px] font-medium mb-1">No niche trends found</p>
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              Add interests in Context → Your Interests to see what's trending in your niche.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
