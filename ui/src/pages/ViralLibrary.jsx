import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Search, Filter, ChevronDown, ChevronUp,
  MessageCircle, Repeat2, Heart, Bookmark, BarChart2, ChevronRight
} from 'lucide-react'

function fmtNum(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function TweetCard({ tweet }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const MAX_LEN = 200
  const shouldTruncate = tweet.text?.length > MAX_LEN
  const authorName = tweet.author?.name || 'Unknown'
  const authorHandle = tweet.author?.username || tweet.author || 'unknown'

  return (
    <div
      className="card p-4 transition-all duration-200"
      style={{ breakInside: 'avoid', marginBottom: '1rem' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px oklch(0 0 0 / 0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
    >
      {/* Author */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{
            background: `linear-gradient(135deg, oklch(0.65 0.19 ${(authorHandle.charCodeAt(0) || 0) % 360} / 0.3), oklch(0.65 0.18 ${((authorHandle.charCodeAt(0) || 0) + 60) % 360} / 0.3))`,
            color: 'var(--color-primary)'
          }}
        >
          {authorName[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold truncate">{authorName}</p>
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            @{authorHandle} · {tweet.date || tweet.timeAgo || ''}
          </p>
        </div>
        {(tweet.author?.followers || 0) > 10000 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
            style={{ background: 'oklch(0.65 0.19 250 / 0.1)', color: 'var(--color-primary)' }}
          >
            {fmtNum(tweet.author.followers)} followers
          </span>
        )}
      </div>

      {/* Text */}
      <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        {shouldTruncate && !expanded
          ? tweet.text.slice(0, MAX_LEN) + '… '
          : tweet.text}
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
        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{fmtNum(tweet.replies)}</span>
        <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{fmtNum(tweet.retweets)}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmtNum(tweet.likes)}</span>
        <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{fmtNum(tweet.bookmarks)}</span>
        <span className="flex items-center gap-1 ml-auto"><BarChart2 className="w-3 h-3" />{fmtNum(tweet.impressions)}</span>
      </div>

      {/* Action */}
      <button
        onClick={() => navigate('/writer', { state: { prefill: tweet.text } })}
        className="flex items-center gap-1 text-[12px] font-medium hover:opacity-80 transition-opacity"
        style={{ color: 'var(--color-primary)' }}
      >
        Use as inspiration <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

const PERIOD_LABELS = { all: 'All time', year: 'Past year', month: 'Past month', week: 'Past week' }
const ACCOUNT_LABELS = { all: 'All accounts', monitored: 'Monitored only' }

export default function ViralLibrary() {
  const [query, setQuery] = useState('')
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [interests, setInterests] = useState([])
  const [period, setPeriod] = useState('all')
  const [account, setAccount] = useState('all')
  const [minLikes, setMinLikes] = useState(100)
  const [minViews, setMinViews] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [includeReplies, setIncludeReplies] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => {
        const userInterests = d.interests || []
        setInterests(userInterests)
        if (userInterests.length > 0) {
          doSearch(userInterests[0], 'all', 'all', 100)
        }
      })
      .catch(() => {})
  }, [])

  const doSearch = async (q, p = period, acc = account, ml = minLikes) => {
    const searchQ = q?.trim()
    if (!searchQ) return
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({
        q: searchQ,
        period: p,
        minLikes: ml,
        account: acc,
        ...(includeReplies ? { includeReplies: '1' } : {}),
      })
      const res = await fetch(`/api/viral?${params}`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setTweets(d.tweets || [])
    } catch (err) {
      setError(err.message || 'Failed to load viral tweets')
      setTweets([])
    }
    setLoading(false)
  }

  const handleSearch = () => doSearch(query || interests[0] || 'AI', period, account, minLikes)

  const handleChip = (interest) => {
    setQuery(interest)
    doSearch(interest, period, account, minLikes)
  }

  const handlePeriodChange = (val) => {
    setPeriod(val)
    doSearch(query || interests[0] || 'AI', val, account, minLikes)
  }

  const handleAccountChange = (val) => {
    setAccount(val)
    doSearch(query || interests[0] || 'AI', period, val, minLikes)
  }

  return (
    <div className="p-6 space-y-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          Viral Library
        </h1>
        <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Search and discover high-performing viral posts by keyword.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search viral tweets by keyword…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Period dropdown */}
        <div className="relative">
          <select
            value={period}
            onChange={e => handlePeriodChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[12px] border cursor-pointer"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {Object.entries(PERIOD_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown
            className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>

        {/* Account dropdown */}
        <div className="relative">
          <select
            value={account}
            onChange={e => handleAccountChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[12px] border cursor-pointer"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {Object.entries(ACCOUNT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown
            className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border hover:opacity-80 transition-all"
          style={{
            borderColor: showAdvanced ? 'var(--color-primary)' : 'var(--color-border-subtle)',
            color: showAdvanced ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: showAdvanced ? 'oklch(0.65 0.19 250 / 0.08)' : 'transparent',
          }}
        >
          <Filter className="w-3 h-3" />
          Advanced Filters
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Advanced Filters panel */}
      {showAdvanced && (
        <div className="card p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Min likes</label>
              <input
                type="number"
                value={minLikes}
                onChange={e => setMinLikes(Number(e.target.value))}
                min={0}
                className="w-20 px-2 py-1 rounded-lg text-[12px] border text-center"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>Min views</label>
              <input
                type="number"
                value={minViews}
                onChange={e => setMinViews(e.target.value)}
                placeholder="Any"
                className="w-24 px-2 py-1 rounded-lg text-[12px] border text-center"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={includeReplies}
                onChange={e => setIncludeReplies(e.target.checked)}
                className="rounded"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Include replies
            </label>
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Quick filter chips */}
      {interests.length > 0 && (
        <div>
          <p
            className="text-[10px] uppercase tracking-wider font-semibold mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Quick filters
          </p>
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 10).map(interest => (
              <button
                key={interest}
                onClick={() => handleChip(interest)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border"
                style={{
                  background: query === interest ? 'oklch(0.65 0.19 250 / 0.12)' : 'transparent',
                  borderColor: query === interest ? 'var(--color-primary)' : 'var(--color-border-subtle)',
                  color: query === interest ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results indicator */}
      {!loading && tweets.length > 0 && (
        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Showing tweets with {fmtNum(minLikes)}+ likes · {tweets.length} results
          {period !== 'all' && ` · ${PERIOD_LABELS[period]?.toLowerCase()}`}
          {account === 'monitored' && ' · monitored accounts only'}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ columnCount: 3, columnGap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card p-4 animate-pulse"
              style={{ breakInside: 'avoid', marginBottom: '1rem' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="space-y-1 flex-1">
                  <div className="h-2.5 rounded-full w-24" style={{ background: 'var(--color-border-subtle)' }} />
                  <div className="h-2 rounded-full w-16" style={{ background: 'var(--color-border-subtle)' }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="h-2.5 rounded-full w-5/6" style={{ background: 'var(--color-border-subtle)' }} />
                <div className="h-2.5 rounded-full w-2/3" style={{ background: 'var(--color-border-subtle)' }} />
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
        <div className="card p-6 text-center">
          <p className="text-[13px] mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button
            onClick={handleSearch}
            className="text-[12px] hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Tweets masonry grid */}
      {!loading && !error && tweets.length > 0 && (
        <div style={{ columnCount: 3, columnGap: '1rem' }}>
          {tweets.map((tweet, i) => (
            <TweetCard key={i} tweet={tweet} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hasSearched && tweets.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1">No viral tweets found</p>
          <p className="text-[12px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Try a different keyword, lower the min likes threshold, or change the time period
          </p>
          <button
            onClick={() => { setMinLikes(10); doSearch(query || interests[0] || 'AI', period, account, 10) }}
            className="text-[12px] font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-primary)' }}
          >
            Try with fewer filters →
          </button>
        </div>
      )}

      {/* Initial state (no search yet, no interests) */}
      {!loading && !error && !hasSearched && interests.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-[15px] font-semibold mb-1">Search for viral tweets</p>
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Enter a keyword above to discover high-performing tweets in any niche
          </p>
        </div>
      )}
    </div>
  )
}
