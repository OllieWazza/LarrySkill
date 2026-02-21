import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, RefreshCw, MessageCircle, Repeat2, Heart, Bookmark, BarChart2, ExternalLink, ChevronRight } from 'lucide-react'

function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function TweetCard({ post }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const MAX_LEN = 180
  const shouldTruncate = post.text?.length > MAX_LEN

  return (
    <div
      className="card p-4 transition-all duration-200 cursor-pointer"
      style={{ breakInside: 'avoid', marginBottom: '1rem' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px oklch(0 0 0 / 0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, oklch(0.65 0.19 ${(post.author?.username?.charCodeAt(0) || 0) % 360} / 0.35), oklch(0.65 0.18 ${((post.author?.username?.charCodeAt(0) || 0) + 60) % 360} / 0.35))`,
            color: 'var(--color-primary)'
          }}
        >
          {(post.author?.name || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold truncate">{post.author?.name}</p>
          <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
            @{post.author?.username} · {post.timeAgo}
          </p>
        </div>
        {post.hasMedia && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
            style={{ background: 'oklch(0.65 0.18 300 / 0.12)', color: 'var(--color-accent)' }}
          >
            📷
          </span>
        )}
        {post.hasLinks && !post.hasMedia && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
            style={{ background: 'oklch(0.65 0.19 250 / 0.12)', color: 'var(--color-primary)' }}
          >
            🔗
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {shouldTruncate && !expanded
          ? post.text.slice(0, MAX_LEN) + '… '
          : post.text}
        {shouldTruncate && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            className="font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            {expanded ? ' Show less' : 'More >>'}
          </button>
        )}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{fmtNum(post.replies)}</span>
        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{fmtNum(post.retweets)}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmtNum(post.likes)}</span>
        <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{fmtNum(post.bookmarks)}</span>
        <span className="flex items-center gap-1 ml-auto"><BarChart2 className="w-3 h-3" />{fmtNum(post.impressions)}</span>
      </div>

      {/* Use as inspiration */}
      <button
        onClick={() => navigate('/writer', { state: { prefill: post.text } })}
        className="flex items-center gap-1 text-[12px] font-medium hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-primary)' }}
      >
        Use as inspiration <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'articles', label: 'Articles' },
  { id: 'media',    label: 'Media' },
]

export default function Inspiration() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasInterests, setHasInterests] = useState(true)

  const fetchPosts = async (activeTab = tab) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/inspiration?tab=${activeTab}`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setPosts(d.posts || [])
      if ((d.posts || []).length === 0 && d.noInterests) setHasInterests(false)
    } catch (err) {
      setError(err.message || 'Failed to load inspiration posts')
    }
    setLoading(false)
  }

  useEffect(() => {
    // Check if user has interests
    fetch('/api/config').then(r => r.json()).then(d => {
      const hasAny = Array.isArray(d.interests) && d.interests.length > 0
      setHasInterests(hasAny)
      fetchPosts(tab)
    }).catch(() => fetchPosts(tab))
  }, [])

  const handleTab = (t) => {
    setTab(t)
    fetchPosts(t)
  }

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            Inspiration
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Discover trending content. Never run out of ideas.
          </p>
        </div>
        <button
          onClick={() => navigate('/viral')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border hover:opacity-80 transition-opacity shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
        >
          <ExternalLink className="w-3 h-3" />
          Explore more
        </button>
      </div>

      {/* No interests banner */}
      {!hasInterests && (
        <button
          onClick={() => navigate('/context')}
          className="w-full card p-4 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          style={{ borderColor: 'var(--color-warning)', background: 'oklch(0.75 0.15 75 / 0.06)' }}
        >
          <Lightbulb className="w-4 h-4 shrink-0" style={{ color: 'var(--color-warning)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-warning)' }}>
              Add interests to see personalised inspiration
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Go to Context → Your Interests to select your topics
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      )}

      {/* Tab filters */}
      <div className="flex items-center gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTab(t.id)}
            className="px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border"
            style={{
              background: tab === t.id ? 'oklch(0.65 0.19 250 / 0.12)' : 'transparent',
              borderColor: tab === t.id ? 'var(--color-primary)' : 'var(--color-border-subtle)',
              color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold flex items-center gap-2">
          Popular posts
          {!loading && (
            <span
              className="text-[11px] font-normal px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)' }}
            >
              {posts.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => fetchPosts()}
          disabled={loading}
          className="flex items-center gap-1.5 text-[12px] hover:opacity-80 transition-opacity disabled:opacity-40"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading skeleton — 3 columns */}
      {loading && (
        <div style={{ columnCount: 3, columnGap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card p-4 animate-pulse"
              style={{ breakInside: 'avoid', marginBottom: '1rem' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 rounded-full w-24" style={{ background: 'var(--color-border-subtle)' }} />
                  <div className="h-2 rounded-full w-16" style={{ background: 'var(--color-border-subtle)' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                {[...Array(i % 3 + 2)].map((_, j) => (
                  <div
                    key={j}
                    className="h-2.5 rounded-full"
                    style={{ width: `${55 + (j * 13) % 40}%`, background: 'var(--color-border-subtle)' }}
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-2 rounded-full w-8" style={{ background: 'var(--color-border-subtle)' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card p-8 text-center">
          <p className="text-[13px] mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button
            onClick={() => fetchPosts()}
            className="text-[12px] hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Posts masonry grid */}
      {!loading && !error && posts.length > 0 && (
        <div style={{ columnCount: 3, columnGap: '1rem' }}>
          {posts.map((post, i) => (
            <TweetCard key={i} post={post} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && posts.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1">No inspiration posts found</p>
          <p className="text-[12px] mb-5" style={{ color: 'var(--color-text-muted)' }}>
            {tab !== 'all'
              ? `No ${tab} posts found. Try switching to "All".`
              : 'Add interests in your Context to get personalised inspiration.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchPosts()}
              className="px-4 py-2 text-[12px] font-medium rounded-lg border hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/context')}
              className="px-5 py-2 text-[13px] font-semibold rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
            >
              Set up Context
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
