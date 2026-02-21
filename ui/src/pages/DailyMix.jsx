import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Star, ShoppingBag, Compass, Image, Zap,
  RefreshCw, Settings, Sliders, ExternalLink, Check, ChevronRight
} from 'lucide-react'

function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const CATEGORIES = [
  { id: 'all',      label: 'All',       icon: null,        textColor: null,                    bgChip: null },
  { id: 'for-you',  label: 'For You',   icon: Star,        textColor: 'oklch(0.75 0.15 75)',    bgChip: 'oklch(0.75 0.15 75 / 0.15)' },
  { id: 'products', label: 'Products',  icon: ShoppingBag, textColor: 'oklch(0.65 0.19 250)',   bgChip: 'oklch(0.65 0.19 250 / 0.12)' },
  { id: 'trending', label: 'Trending',  icon: Compass,     textColor: 'oklch(0.65 0.2 25)',     bgChip: 'oklch(0.65 0.2 25 / 0.12)' },
  { id: 'media',    label: 'Media',     icon: Image,       textColor: 'oklch(0.65 0.18 300)',   bgChip: 'oklch(0.65 0.18 300 / 0.12)' },
  { id: 'viral',    label: 'Viral',     icon: Zap,         textColor: 'oklch(0.72 0.19 155)',   bgChip: 'oklch(0.72 0.19 155 / 0.12)' },
]

function getCatMeta(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]
}

function TweetCard({ tweet, user }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const catMeta = getCatMeta(tweet.category)
  const CatIcon = catMeta?.icon

  const usePost = () => {
    navigator.clipboard.writeText(tweet.text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-5 space-y-3">
      {/* Author + category tag */}
      <div className="flex items-center gap-2.5">
        {user?.profileImage ? (
          <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, oklch(0.65 0.19 250 / 0.3), oklch(0.65 0.18 300 / 0.3))', color: 'var(--color-primary)' }}
          >
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold truncate">{user?.name || 'You'}</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>@{user?.username || 'you'}</p>
        </div>
        {CatIcon && catMeta.textColor && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
            style={{ background: catMeta.bgChip, color: catMeta.textColor }}
          >
            <CatIcon className="w-3 h-3" />
            {catMeta.label}
          </span>
        )}
      </div>

      {/* Tweet text */}
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text)' }}>
        {tweet.text}
      </p>

      {/* Source URL for Trending */}
      {tweet.sourceUrl && (
        <a
          href={tweet.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-primary)' }}
        >
          <ExternalLink className="w-3 h-3" />
          View Source
        </a>
      )}

      {/* Original tweet for Viral */}
      {tweet.original && (
        <div
          className="rounded-lg p-3 text-[11px]"
          style={{ background: 'var(--color-bg-secondary)', borderLeft: '2px solid oklch(0.72 0.19 155 / 0.5)' }}
        >
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Original by @{tweet.original.username}
          </p>
          <p className="line-clamp-2 mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{tweet.original.text}</p>
          <div className="flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
            <span>❤️ {fmtNum(tweet.original.likes)}</span>
            <span>🔁 {fmtNum(tweet.original.retweets)}</span>
            {tweet.original.impressions > 0 && <span>📊 {fmtNum(tweet.original.impressions)}</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
        <span
          className={`text-[11px] font-mono ${tweet.text.length > 240 ? 'text-danger' : tweet.text.length > 200 ? 'text-warning' : ''}`}
          style={tweet.text.length <= 200 ? { color: 'var(--color-text-muted)' } : {}}
        >
          {tweet.text.length}/280
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/writer', { state: { prefill: tweet.text } })}
            className="flex items-center gap-1 text-[11px] hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Edit <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={usePost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all"
          >
            {copied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Use post ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DailyMix() {
  const navigate = useNavigate()
  const [mix, setMix] = useState([])
  const [user, setUser] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [hasContext, setHasContext] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/config').then(r => r.json()),
      fetch('/api/daily-mix').then(r => r.json()),
    ]).then(([cfg, mixData]) => {
      setUser(cfg.user)
      const hasAbout = !!cfg.aboutYou
      const hasInterests = Array.isArray(cfg.interests) && cfg.interests.length > 0
      setHasContext(hasAbout || hasInterests)
      setMix(mixData.posts || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/daily-mix/generate', { method: 'POST' })
      const d = await res.json()
      setMix(d.posts || [])
    } catch {}
    setGenerating(false)
  }

  const filtered = activeCategory === 'all' ? mix : mix.filter(t => t.category === activeCategory)
  const countByCategory = (id) => id === 'all' ? mix.length : mix.filter(t => t.category === id).length

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            Daily Mix
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Daily AI generated posts tailored to your profile and interests that you can use as inspiration or post directly
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/context')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          >
            <Settings className="w-3 h-3" />
            Manage context
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          >
            <Sliders className="w-3 h-3" />
            Customize
          </button>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating
              ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
              : <RefreshCw className="w-3 h-3" />}
            Regenerate
          </button>
        </div>
      </div>

      {/* No context banner */}
      {!hasContext && !loading && (
        <button
          onClick={() => navigate('/context')}
          className="w-full card p-4 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          style={{ borderColor: 'var(--color-warning)', background: 'oklch(0.75 0.15 75 / 0.06)' }}
        >
          <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-warning)' }}>
              Set up your Context for better AI-generated posts
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Add your bio, interests, and products so the AI can tailor the mix to you
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      )}

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = countByCategory(cat.id)
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all border"
              style={{
                background: isActive ? 'oklch(0.65 0.19 250 / 0.12)' : 'transparent',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {cat.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: isActive ? 'oklch(0.65 0.19 250 / 0.15)' : 'var(--color-bg-secondary)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Loading / generating skeleton */}
      {(loading || generating) && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="space-y-1 flex-1">
                  <div className="h-2.5 rounded-full w-24" style={{ background: 'var(--color-border-subtle)' }} />
                  <div className="h-2 rounded-full w-16" style={{ background: 'var(--color-border-subtle)' }} />
                </div>
                <div className="h-5 w-16 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="h-2.5 rounded-full w-4/5" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="h-2.5 rounded-full w-3/5" style={{ background: 'var(--color-border-subtle)' }} />
              </div>
            </div>
          ))}
          {generating && (
            <p className="text-center text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              ✨ Generating your Daily Mix — this takes about 10-15 seconds…
            </p>
          )}
        </div>
      )}

      {/* Tweet cards */}
      {!loading && !generating && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((tweet, i) => (
            <TweetCard key={i} tweet={tweet} user={user} />
          ))}
        </div>
      )}

      {/* No results for selected filter */}
      {!loading && !generating && mix.length > 0 && filtered.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-[14px] font-medium mb-1">
            No {CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory} posts in this mix
          </p>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Try regenerating or select a different category
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !generating && mix.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1">Generate your Daily Mix</p>
          <p className="text-[12px] mb-5" style={{ color: 'var(--color-text-muted)' }}>
            15 AI-crafted posts across 5 categories — tailored to your profile and interests
          </p>
          <button
            onClick={generate}
            className="px-5 py-2.5 text-[13px] font-semibold rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
          >
            Generate Now ✨
          </button>
        </div>
      )}
    </div>
  )
}
